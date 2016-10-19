# -*- coding: utf-8 -*-`
"""api.py - Create and configure the Game API exposing the resources.
This can also contain game logic. For more complex games it would be wise to
move game logic to another file. Ideally the API will be simple, concerned
primarily with communication to/from the API's users."""


import logging
import endpoints
from protorpc import remote, messages
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.ext import ndb

from models import User, Game, Score, Board, Fleet, StringMessage
from models import BoardForm, NewGameForm, GameForm, GameForms
from models import MakeMoveForm, ScoreForms, PlaceShipForm

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
MAKE_MOVE_REQUEST = endpoints.ResourceContainer(
    MakeMoveForm,
    urlsafe_game_key=messages.StringField(1),)
USER_REQUEST = endpoints.ResourceContainer(user_name=messages.StringField(1),
                                           email=messages.StringField(2))

#MEMCACHE_MOVES_REMAINING = 'MOVES_REMAINING'

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
        user = User(name=request.user_name, email=request.email)
        user.put()
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

        # Use a task queue to update the average attempts remaining.
        # This operation is not needed to complete the creation of a new game
        # so it is performed out of sequence.
        #taskqueue.add(url='/tasks/cache_average_attempts')
        return game.to_form('Good luck playing Battleship! Your move.')

    @endpoints.method(request_message=GET_GAME_REQUEST,
                      response_message=GameForm,
                      path='game/{urlsafe_game_key}',
                      name='get_game',
                      http_method='GET')
    def get_game(self, request):
        """Return the current game state."""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if game:
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
        games = Game.query()
        games = games.filter(Game.user == user.key)
        games = games.filter(Game.game_over == False).fetch()
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
        if request.ship not in ship_list:
            raise endpoints.BadRequestException('Invalid ship type')
        logging.info('place_ship endpoint calls _valid_placement')
        if self._valid_placement(request):
            logging.info('_valid_placement==true, call _execute_placement')
            return self._execute_placement(request)
        else:
            logging.info('_valid_placement == False, raise exception')
            raise endpoints.BadRequestException('Invalid ship placement')


    # ahFkZXZ-ZnNuZC1nYW1lLWFwaXIRCxIER2FtZRiAgICAgOjdCww

    @endpoints.method(request_message=BOARD_REQUEST,
                    response_message=BoardForm,
                    path='game/{urlsafe_game_key}/board',
                    name='show_board',
                    http_method='POST')
    def show_board(self, request):
        """Display a board state"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        board_key = getattr(game, request.board)
        board = board_key.get()
        return board.to_form()

    def _process_move(self, move_row, move_col, chart, board, fleet):
        """Checks whether a move hits the opposing fleet

        If so, updates the hp of the hit ship, and status if the
        hit sinks it, as well as updates the chart of the attacker.
        Locations on the chart that have been fired at will be marked
        with 'O', whereas empty spots not fired upon are '0'.

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
            hit_ship_hp -= 1
            setattr(fleet, hit_ship + '_hp', hit_ship_hp)
            if hit_ship_hp <= 0:
                setattr(fleet, hit_ship + '_status', 'sunk')
                result = hit_ship + ' sunk!'
            fleet.put()
            return result
        else:
            getattr(chart, 'row_' + str(move_row))[move_col] = 'O'
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
        except IndexError:
            pass
        try:
            if getattr(chart, 'row_' + str(row))[col - 1] == '0':
                return [row, col - 1]
        except IndexError:
            pass
        try:
            if getattr(chart, 'row_' + str(row))[col + 1] == '0':
                return [row, col + 1]
        except IndexError:
            pass
        try:
            if getattr(chart, 'row_' + str(row + 1))[col] == '0':
                return [row + 1, col]
        except IndexError:
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
        # build a list of all X locations on the chart
        hits = []
        row_index = 0
        for row in rows:
            for i in range(len(getattr(ai_chart, row))):
                if getattr(ai_chart, row)[i] == 'X':
                    hits.append([row_index, i])
            row_index += 1
        # have computer check around each hit marked on the chart
        for coordinates in hits:
            target = self._check_round(ai_chart, coordinates)
            if target == None:
                continue
            else:
                return target[0], target[1]
        # if all existing hits are fully surrounded by missed shots,
        # then try again with a random move
        return self._make_random_move(ai_chart)

    @endpoints.method(request_message=MAKE_MOVE_REQUEST,
                      response_message=GameForm,
                      path='game/{urlsafe_game_key}',
                      name='make_move',
                      http_method='PUT')
    def make_move(self, request):
        """Makes a move. Returns a game state with message"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if game.game_over:
            return game.to_form('Game already over!')
        if (0 > request.move_row > 9) or (0 > request.move_col > 9):
            raise endpoints.BadRequestException('Coordinates not valid')
        game.move_count += 1
        user_chart = game.user_chart.get()
        ai_board = game.ai_board.get()
        ai_fleet = game.ai_fleet.get()
        result = self._process_move(request.move_row,
                                    request.move_col,
                                    user_chart,
                                    ai_board,
                                    ai_fleet)
        if result == 'Hit!':
            msg = 'Your shot hit!'
        elif result == 'Miss':
            msg = 'Your shot missed.'
        else:
            if ai_fleet.fleet_status() == 'Fleet destroyed':
                game.end_game(True)
                game.game_over = True
                msg = result + ' Enemy fleet annihilated, you win!'
                game.put()
                return game.to_form(msg)
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
        if ai_result == 'Hit!':
            msg += ' Enemy returns fire with a hit!'
        elif ai_result == 'Miss':
            msg += ' Enemy returns fire, but misses.'
        else:
            if user_fleet.fleet_status() == 'Fleet destroyed':
                game.end_game(False)
                game.game_over = True
                msg += ' Enemy returns fire, ' + ai_result
                msg += ' Your fleet now rests at the bottom of the sea.'
                msg += ' Computer wins!'
                game.put()
                return game.to_form(msg)
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

    '''
    @endpoints.method(response_message=StringMessage,
                      path='games/average_attempts',
                      name='get_average_attempts_remaining',
                      http_method='GET')
    def get_average_attempts(self, request):
        """Get the cached average moves remaining"""
        return StringMessage(message=memcache.get(MEMCACHE_MOVES_REMAINING) or '')

    @staticmethod
    def _cache_average_attempts():
        """Populates memcache with the average moves remaining of Games"""
        games = Game.query(Game.game_over == False).fetch()
        if games:
            count = len(games)
            total_attempts_remaining = sum([game.attempts_remaining
                                        for game in games])
            average = float(total_attempts_remaining)/count
            memcache.set(MEMCACHE_MOVES_REMAINING,
                         'The average moves remaining is {:.2f}'.format(average))
    '''


api = endpoints.api_server([BattleshipAPI])
