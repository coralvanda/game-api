"""models.py - This file contains the class definitions for the Datastore
entities used by the Game. Because these classes are also regular Python
classes they can include methods (such as 'to_form' and 'new_game')."""

import random
from datetime import date
from protorpc import messages
from google.appengine.ext import ndb


class User(ndb.Model):
    """User profile"""
    name = ndb.StringProperty(required=True)
    email =ndb.StringProperty()


class Game(ndb.Model):
    """Game object"""
    move_count = ndb.IntegerProperty()
    game_over = ndb.BooleanProperty(required=True, default=False)
    user = ndb.KeyProperty(required=True, kind='User')
    player_board = ndb.KeyProperty(kind='Board')
    player_chart = ndb.KeyProperty(kind='Board')
    AI_board = ndb.KeyProperty(kind='Board')
    AI_chart = ndb.KeyProperty(kind='Board')

    @classmethod
    def new_game(cls, user):
        """Creates and returns a new game"""
        #if max < min:
        #    raise ValueError('Maximum must be greater than minimum')
        game = Game(user=user,
                    game_over=False)
        game.put()
        return game

    def to_form(self, message):
        """Returns a GameForm representation of the Game"""
        form = GameForm()
        form.urlsafe_key = self.key.urlsafe()
        form.user_name = self.user.get().name
        form.move_count = self.move_count
        form.game_over = self.game_over
        form.message = message
        return form

    def make_move(self, move):
        pass

    def check_state(self):
        pass

    def end_game(self, won=False):
        """Ends the game - if won is True, the player won. - if won is False,
        the player lost."""
        self.game_over = True
        self.put()
        # Add the game to the score 'board'
        score = Score(user=self.user, date=date.today(), won=won,
                      moves=self.move_count)
        score.put()


class Board(ndb.Model):
    """Board object"""
    row_1 = ndb.StringProperty(repeated=True)
    row_2 = ndb.StringProperty(repeated=True)
    row_3 = ndb.StringProperty(repeated=True)
    row_4 = ndb.StringProperty(repeated=True)
    row_5 = ndb.StringProperty(repeated=True)
    row_6 = ndb.StringProperty(repeated=True)
    row_7 = ndb.StringProperty(repeated=True)
    row_8 = ndb.StringProperty(repeated=True)
    row_9 = ndb.StringProperty(repeated=True)
    row_10 = ndb.StringProperty(repeated=True)

    def build_board(self):
        pass

    def place_ship(self, ship):
        pass

    def validate_placement(self, ship_size, bow_position, orientation):
        pass

    def mark_board(self, location):
        pass

    def to_form(self):
        pass


class Fleet(ndb.Model):
    """Ships model"""
    carrier     = ndb.IntegerProperty(default=5)
    battleship  = ndb.IntegerProperty(default=4)
    cruiser     = ndb.IntegerProperty(default=3)
    submarine   = ndb.IntegerProperty(default=3)
    destroyer   = ndb.IntegerProperty(default=2)

    def register_hit(self, ship):
        pass


class Score(ndb.Model):
    """Score object"""
    user = ndb.KeyProperty(required=True, kind='User')
    date = ndb.DateProperty(required=True)
    won = ndb.BooleanProperty(required=True)
    moves = ndb.IntegerProperty(required=True)

    def to_form(self):
        return ScoreForm(user_name=self.user.get().name, won=self.won,
                         date=str(self.date), moves=self.moves)


class GameForm(messages.Message):
    """GameForm for outbound game state information"""
    urlsafe_key = messages.StringField(1, required=True)
    move_count = messages.IntegerField(2, required=True)
    game_over = messages.BooleanField(3, required=True)
    message = messages.StringField(4, required=True)
    user_name = messages.StringField(5, required=True)


class NewGameForm(messages.Message):
    """Used to create a new game"""
    user_name = messages.StringField(1, required=True)
    #attempts = messages.IntegerField(4, default=5)


class BoardForm(messages.Message):
    """Used to show a board state"""
    pass


class MakeMoveForm(messages.Message):
    """Used to make a move in an existing game"""
    move = messages.IntegerField(1, required=True)


class ScoreForm(messages.Message):
    """ScoreForm for outbound Score information"""
    user_name = messages.StringField(1, required=True)
    date = messages.StringField(2, required=True)
    won = messages.BooleanField(3, required=True)
    moves = messages.IntegerField(4, required=True)


class ScoreForms(messages.Message):
    """Return multiple ScoreForms"""
    items = messages.MessageField(ScoreForm, 1, repeated=True)


class StringMessage(messages.Message):
    """StringMessage-- outbound (single) string message"""
    message = messages.StringField(1, required=True)
