# -*- coding: utf-8 -*-`
"""api.py - Create and configure the Game API exposing the resources.
This can also contain game logic. For more complex games it would be wise to
move game logic to another file. Ideally the API will be simple, concerned
primarily with communication to/from the API's users."""

import random
import logging
import endpoints
from protorpc import remote, messages
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.ext import ndb

from models.user import User
from models.game import Game
from models.score import Score
from models.board import Board
from models.fleet import Fleet

from forms.stringmessage import StringMessage
from forms.stringmessages import StringMessages
from forms.boardform import BoardForm
from forms.newgameform import NewGameForm
from forms.gameform import GameForm
from forms.gameforms import GameForms
from forms.makemoveform import MakeMoveForm
from forms.scoreforms import ScoreForms
from forms.placeshipform import PlaceShipForm
from forms.fleetstatusform import FleetStatusForm
from forms.gamehistoryform import GameHistoryForm

from utils import get_by_urlsafe, ai_fleet_builder
from settings import WEB_CLIENT_ID

API_EXPLORER_CLIENT_ID = endpoints.API_EXPLORER_CLIENT_ID
NEW_GAME_REQUEST = endpoints.ResourceContainer(NewGameForm)
PLACE_SHIP_REQUEST = endpoints.ResourceContainer(
    PlaceShipForm,
    urlsafe_game_key=messages.StringField(1))
GET_GAME_REQUEST = endpoints.ResourceContainer(
    urlsafe_game_key=messages.StringField(1),)
BOARD_REQUEST = endpoints.ResourceContainer(
    urlsafe_game_key=messages.StringField(1),
    board=messages.StringField(2))
FLEET_REQUEST = endpoints.ResourceContainer(
    urlsafe_game_key=messages.StringField(1),
    fleet=messages.StringField(2))
MAKE_MOVE_REQUEST = endpoints.ResourceContainer(
    MakeMoveForm,
    urlsafe_game_key=messages.StringField(1),)
USER_REQUEST = endpoints.ResourceContainer(user_name=messages.StringField(1),
                                           email=messages.StringField(2))


@endpoints.api( name='battleship',
                version='v1',
                allowed_client_ids=[WEB_CLIENT_ID, API_EXPLORER_CLIENT_ID])
class BattleshipAPI(remote.Service):
    """Game API"""
    @endpoints.method(request_message=USER_REQUEST,
                      response_message=StringMessage,
                      path='user',
                      name='create_user',
                      http_method='POST')
    def create_user(self, request):
        """Create a User. Requires a unique username"""
        if User.query(User.name == request.user_name).get():
            raise endpoints.ConflictException(
                    'A User with that name already exists!')
        u = User._register(request.user_name, request.password, request.email)
        u.put()
        return StringMessage(message='User {} created!'.format(
                request.user_name))

    @endpoints.method(request_message=NEW_GAME_REQUEST,
                      response_message=GameForm,
                      path='game',
                      name='new_game',
                      http_method='POST')
    def new_game(self, request):
        """Creates new game"""
        user = User.query(User.name == request.user_name).get()
        if not user:
            raise endpoints.NotFoundException(
                    'A User with that name does not exist!')
        game = Game.new_game(user.key)
        ai_fleet = game.ai_fleet.get()
        ai_board = game.ai_board.get()
        ai_fleet_formation = ai_fleet_builder()
        for x in range(len(ai_fleet_formation)):
            setattr(ai_board, 'row_' + str(x), ai_fleet_formation[x])
        ai_fleet.carrier_status = 'placed'
        ai_fleet.battleship_status = 'placed'
        ai_fleet.cruiser_status = 'placed'
        ai_fleet.submarine_status = 'placed'
        ai_fleet.destroyer_status = 'placed'
        ai_fleet.put()
        ai_board.put()
        return game.to_form('Good luck playing Battleship!')

    @endpoints.method(request_message=GET_GAME_REQUEST,
                      response_message=GameForm,
                      path='game/{urlsafe_game_key}',
                      name='get_game',
                      http_method='GET')
    def get_game(self, request):
        """Return the current game state."""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if game:
            if game.game_over:
                return game.to_form('Game concluded')
            return game.to_form('Time to play!')
        else:
            raise endpoints.NotFoundException('Game not found!')

    @endpoints.method(request_message=USER_REQUEST,
                    response_message=GameForms,
                    path='games/player',
                    name='get_games_by_player',
                    http_method='GET')
    def get_games_by_player(self, request):
        """Return a list of active games a player is engaged in"""
        user = User.query(User.name == request.user_name).get()
        if not user:
            raise endpoints.NotFoundException('No such user found')
        games = Game.query()
        games = games.filter(Game.user == user.key)
        games = games.filter(Game.game_over == False).fetch()
        if not games:
            raise endpoints.NotFoundException('No games for this user')
        return GameForms(games=[game.to_form('') for game in games])

    def _valid_placement(self, request):
        """Confirms that a ship has been placed in a legal position

        Returns:
            Either True or False for legal or illegal placements"""
        logging.info('inside _valid_placement')
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        board = game.user_board.get()
        fleet = game.user_fleet.get()
        ship_size = fleet.return_size(request.ship)
        ship_status = getattr(fleet, request.ship + '_status')
        if ship_status == 'placed' or ship_status == 'sunk':
            logging.info('ship_status: ' + ship_status)
            logging.info('ship_status == placed or sunk, return False')
            return False
        if request.orientation == 'vertical':
            logging.info('orientation == vertical')
            for x in range(ship_size):
                if request.bow_row + x > 9:
                    logging.info('ship exceeds size of board, return False')
                    return False
                if getattr(board, 'row_' +
                    str(request.bow_row + x))[request.bow_position] != '0':
                    logging.info('ship overlaps with another, return False')
                    return False
        else:
            for x in range(ship_size):
                if request.bow_position + x > 9:
                    logging.info('ship exceeds size of board, return False')
                    return False
                if getattr(board,'row_' +
                    str(request.bow_row))[request.bow_position + x] != '0':
                    logging.info('ship overlaps with another, return False')
                    return False
        logging.info('_valid_placement ends, returns True')
        return True

    @ndb.transactional(xg=True)
    def _execute_placement(self, request):
        """Places a ship on the user's board and updates ship status"""
        logging.info('inside _execute_placement')
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        board = game.user_board.get()
        fleet = game.user_fleet.get()
        ship_size = fleet.return_size(request.ship)
        ship_string_dict = {'carrier': 'C',
                            'battleship': 'B',
                            'cruiser': 'c',
                            'submarine': 'S',
                            'destroyer': 'D'}
        ship_string = ship_string_dict[request.ship]

        if request.orientation == 'vertical':
            logging.info('orientation == vertical')
            for x in range(ship_size):
                row = getattr(board, 'row_' + str(request.bow_row + x))
                row[request.bow_position] = ship_string
                setattr(board, 'row_' + str(request.bow_row + x), row)
                logging.info('set row to ' + ''.join(row))
        else:
            logging.info('orientation == horizontal')
            for x in range(ship_size):
                row = getattr(board, 'row_' + str(request.bow_row))
                row[request.bow_position + x] = ship_string
                setattr(board, 'row_' + str(request.bow_row), row)
                logging.info('set row to ' + ''.join(row))
        board.put()
        setattr(fleet, request.ship + '_status', 'placed')
        fleet.put()
        return StringMessage(message='{} placed'.format(request.ship))

    @endpoints.method(request_message=PLACE_SHIP_REQUEST,
                      response_message=StringMessage,
                      path='game/{urlsafe_game_key}/place_ship',
                      name='place_ship',
                      http_method='POST')
    def place_ship(self, request):
        """Position a ship on your board"""
        ship_list = ['carrier', 'battleship', 'cruiser',
                    'submarine', 'destroyer']
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found')
        if request.ship not in ship_list:
            raise endpoints.BadRequestException('Invalid ship type')
        logging.info('place_ship endpoint calls _valid_placement')
        if self._valid_placement(request):
            logging.info('_valid_placement==true, call _execute_placement')
            return self._execute_placement(request)
        else:
            logging.info('_valid_placement == False, raise exception')
            raise endpoints.BadRequestException('Invalid ship placement')

    def _all_ships_placed(self, game):
        user_fleet = game.user_fleet.get()
        if user_fleet.carrier_status == '':
            return False
        if user_fleet.battleship_status == '':
            return False
        if user_fleet.cruiser_status == '':
            return False
        if user_fleet.submarine_status == '':
            return False
        if user_fleet.destroyer_status == '':
            return False
        return True


    @endpoints.method(request_message=BOARD_REQUEST,
                    response_message=StringMessages,
                    path='game/{urlsafe_game_key}/board',
                    name='show_board',
                    http_method='POST')
    def show_board(self, request):
        """Display a board state"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found')
        board_key = getattr(game, request.board)
        board = board_key.get()
        board_form = board.to_form()
        board_list = [board_form.row_0, board_form.row_1,
            board_form.row_2, board_form.row_3, board_form.row_4,
            board_form.row_5, board_form.row_6, board_form.row_7,
            board_form.row_8, board_form.row_9]
        return StringMessages(items=[str(i) + \
            ": " + board_list[i] for i in range(len(board_list))])

    @endpoints.method(request_message=FLEET_REQUEST,
                    response_message=FleetStatusForm,
                    path='game/{urlsafe_game_key}/fleet',
                    name='view_fleet_health',
                    http_method='GET')
    def view_fleet_health(self, request):
        """Returns a form displaying the current status of a fleet"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found')
        fleet_key = getattr(game, request.fleet)
        fleet = fleet_key.get()
        return fleet.fleet_status()

    def _process_move(self, move_row, move_col, chart, board, fleet):
        """Checks whether a move hits the opposing fleet

        If so, updates the hp of the hit ship, and status if the
        hit sinks it, as well as updates the chart of the attacker.
        Locations on the chart that have been fired at will be marked
        with '-' if no ship, and 'X' if a ship, whereas empty spots
        not fired upon are '0'.

        Returns:
            A string containing 'Hit!', 'Miss', or 'x sunk' with
            x being the type of ship that was hit."""
        ships = {'C': 'carrier',
                'B': 'battleship',
                'c': 'cruiser',
                'S': 'submarine',
                'D': 'destroyer'}
        result = 'Miss'
        board_row = getattr(board, 'row_' + str(move_row))
        if board_row[move_col] in ships.keys():
            result = 'Hit!'
            hit_ship = ships[board_row[move_col]]
            getattr(chart, 'row_' + str(move_row))[move_col] = 'X'
            chart.put()
            hit_ship_hp = getattr(fleet, hit_ship + '_hp')
            logging.info('ship hp before modifying: ' + str(hit_ship_hp))
            hit_ship_hp -= 1
            logging.info('ship hp after modifying: ' + str(hit_ship_hp))
            setattr(fleet, hit_ship + '_hp', hit_ship_hp)
            if hit_ship_hp <= 0:
                logging.info('inside hp <= 0 statement')
                setattr(fleet, hit_ship + '_status', 'sunk')
                result = hit_ship + ' sunk!'
            fleet.put()
            return result
        else:
            getattr(chart, 'row_' + str(move_row))[move_col] = '-'
            chart.put()
            return result

    def _make_random_move(self, ai_chart):
        """Returns a tuple of two random ints between 0-9

        Confirms that the location has not already been fired upon
        before returning a value"""
        row = random.randint(0, 9)
        col = random.randint(0, 9)
        chart_row = getattr(ai_chart, 'row_' + str(row))
        while chart_row[col] != '0':
            row = random.randint(0, 9)
            col = random.randint(0, 9)
            chart_row = getattr(ai_chart, 'row_' + str(row))
        return row, col

    def _check_round(self, chart, coordinates):
        """Looks at all chart positions around coordinates parameter

        Considers only up, down, left, and right.  If a location is
        found that hasn't been fired upon, it returns a list containing
        the coordinates of that location"""
        row = coordinates[0]
        col = coordinates[1]
        try:
            if getattr(chart, 'row_' + str(row - 1))[col] == '0':
                return [row - 1, col]
        except (AttributeError, IndexError) as e:
            logging.info('exception in _check_round for error ' + str(e))
            pass
        try:
            if getattr(chart, 'row_' + str(row))[col - 1] == '0':
                return [row, col - 1]
        except (AttributeError, IndexError) as e:
            logging.info('exception in _check_round for error ' + str(e))
            pass
        try:
            if getattr(chart, 'row_' + str(row))[col + 1] == '0':
                return [row, col + 1]
        except (AttributeError, IndexError) as e:
            logging.info('exception in _check_round for error ' + str(e))
            pass
        try:
            if getattr(chart, 'row_' + str(row + 1))[col] == '0':
                return [row + 1, col]
        except (AttributeError, IndexError) as e:
            logging.info('exception in _check_round for error ' + str(e))
            pass
        return None

    def _get_ai_move(self, game):
        """Returns a tuple of coordinates for the AI to use as its move

        Will return a random target if no ships have been hit yet, or
        if all positions around hit locations have been fired upon.
        If hits are marked on the chart, it will fire around them to
        search for other sections of a ship that was hit but not sunk."""
        ai_chart = game.ai_chart.get()
        do_random_move = True
        rows = ['row_0', 'row_1', 'row_2', 'row_3', 'row_4', 'row_5',
            'row_6', 'row_7', 'row_8', 'row_9']
        for row in rows:
            if 'X' in getattr(ai_chart, row):
                do_random_move = False
                break
        if do_random_move:
            move_row, move_col = self._make_random_move(ai_chart)
            return move_row, move_col
        hits = []
        row_index = 0
        for row in rows:
            for i in range(len(getattr(ai_chart, row))):
                if getattr(ai_chart, row)[i] == 'X':
                    hits.append([row_index, i])
            row_index += 1
        for coordinates in hits:
            target = self._check_round(ai_chart, coordinates)
            if target == None:
                continue
            else:
                return target[0], target[1]
        return self._make_random_move(ai_chart)

    @endpoints.method(request_message=MAKE_MOVE_REQUEST,
                      response_message=GameForm,
                      path='game/{urlsafe_game_key}',
                      name='make_move',
                      http_method='PUT')
    def make_move(self, request):
        """Makes a move. Returns a game state with message"""
        msg = ''
        move = ''
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found')
        if game.game_over:
            raise endpoints.ForbiddenException('Game already over')
        if self._all_ships_placed(game) == False:
            raise endpoints.BadRequestException('Must place all ships first')
        if (0 > request.move_row > 9) or (0 > request.move_col > 9):
            raise endpoints.BadRequestException('Coordinates not valid')
        game.move_count += 1
        user_chart = game.user_chart.get()
        row = 'row_' + str(request.move_row)
        position = getattr(user_chart, row)[request.move_col]
        if (position == 'X') or (position == '-'):
            raise endpoints.BadRequestException('You have already fired there')
        ai_board = game.ai_board.get()
        ai_fleet = game.ai_fleet.get()
        result = self._process_move(request.move_row,
                                    request.move_col,
                                    user_chart,
                                    ai_board,
                                    ai_fleet)
        move = 'Player: ' + str(request.move_row) + ', ' + str(request.move_col)
        move += ' ' + result
        game.move_hist.append(move)
        if result == 'Hit!':
            msg = 'Your shot hit!'
        elif result == 'Miss':
            msg = 'Your shot missed.'
        else:
            if ai_fleet.fleet_status().condition == ['Fleet destroyed']:
                game.end_game(True)
                game.game_over = True
                msg = 'Your shot hit, ' + result
                msg += ' Enemy fleet annihilated, you win!'
                game.put()
                return game.to_form(msg)
            else:
                msg = 'Your shot hit, ' + result
        game.put()

        # now the computer makes a move
        ai_chart = game.ai_chart.get()
        user_board = game.user_board.get()
        user_fleet = game.user_fleet.get()
        ai_move_row, ai_move_col = self._get_ai_move(game)
        ai_result = self._process_move(ai_move_row,
                                    ai_move_col,
                                    ai_chart,
                                    user_board,
                                    user_fleet)
        move = 'Computer: ' + str(ai_move_row) + ', ' + str(ai_move_col)
        move += ' ' + ai_result
        game.move_hist.append(move)
        if ai_result == 'Hit!':
            msg += ' Enemy returns fire with a hit!'
        elif ai_result == 'Miss':
            msg += ' Enemy returns fire, but misses.'
        else:
            if user_fleet.fleet_status().condition == ['Fleet destroyed']:
                game.end_game(False)
                game.game_over = True
                msg += ' Enemy returns fire, ' + ai_result
                msg += ' Your fleet now rests at the bottom of the sea.'
                msg += ' Computer wins!'
                game.put()
                return game.to_form(msg)
            else:
                msg += ' Enemy returns fire with a hit! ' + ai_result
        game.put()
        return game.to_form(msg)

    @endpoints.method(response_message=ScoreForms,
                      path='scores',
                      name='get_scores',
                      http_method='GET')
    def get_scores(self, request):
        """Return all scores"""
        return ScoreForms(items=[score.to_form() for score in Score.query()])

    @endpoints.method(request_message=USER_REQUEST,
                      response_message=ScoreForms,
                      path='scores/user/{user_name}',
                      name='get_user_scores',
                      http_method='GET')
    def get_user_scores(self, request):
        """Returns all of an individual User's scores"""
        user = User.query(User.name == request.user_name).get()
        if not user:
            raise endpoints.NotFoundException(
                    'A User with that name does not exist!')
        scores = Score.query(Score.user == user.key)
        return ScoreForms(items=[score.to_form() for score in scores])

    @endpoints.method(response_message=ScoreForms,
                    path='top-scores',
                    name='get_top_scores',
                    http_method='GET')
    def get_top_scores(self, request):
        """Returns the top 10 scores"""
        scores = Score.query(Score.won == True)
        scores = scores.order(Score.moves).fetch(10)
        return ScoreForms(items=[score.to_form() for score in scores])

    @endpoints.method(request_message=GET_GAME_REQUEST,
                    response_message=StringMessage,
                    path='game/{urlsafe_game_key}/cancel',
                    name='cancel_game',
                    http_method='POST')
    def cancel_game(self, request):
        """Allows a user to cancel a game in progress"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found')
        if game.game_over == True:
            raise endpoints.BadRequestException('Cannot cancel completed games')
        keys = [game.user_fleet, game.user_board, game.user_chart,
                game.ai_fleet, game.ai_board, game.ai_chart, game.key]
        ndb.delete_multi(keys)
        return StringMessage(message='Deleted game and its boards and fleets')


    @endpoints.method(response_message=StringMessages,
                    path='rankings',
                    name='get_user_rankings',
                    http_method='GET')
    def get_user_rankings(self, request):
        """Returns a list of users ranked by win percentage"""
        users = User.query()
        if not users:
            raise endpoints.NotFoundException('No users found')
        user_ratings = []
        for user in users:
            user_name = user.name
            scores = Score.query(Score.user == user.key)
            wins = scores.filter(Score.won == True).fetch()
            loses = scores.filter(Score.won == False).fetch()
            win_percentage = (len(wins) / (len(wins) + len(loses))) * 100
            avg_moves = 0
            for score in scores:
                avg_moves += score.moves
            avg_moves = avg_moves / (len(wins) + len(loses))
            user_ratings.append([user_name, win_percentage, avg_moves])
        user_ratings = sorted(user_ratings, key=lambda x: (-x[1], x[2]))
        messages = []
        for rating in user_ratings:
            message = 'Name: ' + rating[0] + ', Win rating: '
            message += str(rating[1]) + '%, Average Moves: '
            message += str(rating[2])
            messages.append(message)
        return StringMessages(items=[m for m in messages])

    @endpoints.method(request_message=GET_GAME_REQUEST,
                    response_message=GameHistoryForm,
                    path='game/{urlsafe_game_key}/history',
                    name='get_game_history',
                    http_method='GET')
    def get_game_history(self, request):
        """Returns a play-by-play history of a given game"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found')
        return game.return_history()


api = endpoints.api_server([BattleshipAPI])