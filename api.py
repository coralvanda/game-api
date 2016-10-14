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

from models import User, Game, Score, Board, Fleet, StringMessage
from models import BoardForm, NewGameForm, GameForm, MakeMoveForm
from models import ScoreForms, PlaceShipForm, BoardRequestForm
from utils import get_by_urlsafe
from settings import WEB_CLIENT_ID

API_EXPLORER_CLIENT_ID = endpoints.API_EXPLORER_CLIENT_ID
NEW_GAME_REQUEST = endpoints.ResourceContainer(NewGameForm)
PLACE_SHIP_REQUEST = endpoints.ResourceContainer(
    PlaceShipForm,
    urlsafe_game_key=messages.StringField(1))
GET_GAME_REQUEST = endpoints.ResourceContainer(
    urlsafe_game_key=messages.StringField(1),)
BOARD_REQUEST = endpoints.ResourceContainer(
    BoardRequestForm,
    urlsafe_game_key=messages.StringField(1))
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

        # Use a task queue to update the average attempts remaining.
        # This operation is not needed to complete the creation of a new game
        # so it is performed out of sequence.
        #taskqueue.add(url='/tasks/cache_average_attempts')
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
            return game.to_form('Time to play!')
        else:
            raise endpoints.NotFoundException('Game not found!')

    @endpoints.method(request_message=PLACE_SHIP_REQUEST,
                      response_message=StringMessage,
                      path='game/{urlsafe_game_key}/place_ship',
                      name='place_ship',
                      http_method='POST')
    def place_ship(self, request):
        """Position a ship on your board"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        board = game.user_board.get()
        #fleet = game.user_fleet.get()
        if board.valid_placement(Fleet.return_size(request.ship),
                                request.bow_row,
                                request.bow_position,
                                request.orientation):
            board.place_ship(request.ship,
                            request.bow_row,
                            request.bow_position,
                            request.orientation)
            return StringMessage(message='{} placed'.format(request.ship))
        else:
            raise Error('Invalid ship placement')

    @endpoints.method(request_message=BOARD_REQUEST,
                    response_message=BoardForm,
                    path='game/{urlsafe_game_key}/board',
                    name='show_board',
                    http_method='GET')
    def show_board(self):
        """Display a board state"""
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        board_key = getattr(game, request.board)
        board = board_key.get()
        return board.to_form()


    '''IN PROGRESS, TEMPORARILY DISABLED
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

        game.move_count += 1
        result = game.make_move(request.move)
        if result:
            msg = 'Hit!'
        else:
            msg = 'Miss'

        # Should also check here for newly sunken ship

        game_state = game.check_state()

        if game_state == 'User wins':
            game.end_game(True)
            return game.to_form(msg + ' You win!')
        elif game_state == 'AI wins':
            game.end_game(False)
            return game.to_form(msg + ' Computer wins!')
        else:
            game.put()
            return game.to_form(msg)
    '''

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
