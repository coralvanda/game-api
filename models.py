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
    user_fleet = ndb.KeyProperty(kind='Fleet')
    user_board = ndb.KeyProperty(kind='Board')
    user_chart = ndb.KeyProperty(kind='Board')
    AI_fleet = ndb.KeyProperty(kind='Fleet')
    AI_board = ndb.KeyProperty(kind='Board')
    AI_chart = ndb.KeyProperty(kind='Board')

    @classmethod
    def new_game(cls, user):
        """Creates and returns a new game"""
        game = Game(user=user,
                    user_fleet=Fleet().key,
                    user_board=Board().key,
                    user_chart=Board().key,
                    AI_fleet=Fleet().key,
                    AI_board=Board().key,
                    AI_chart=Board().key,
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
        """No need to update move count here, it's already done in
        api.py"""
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

    def place_ship(self, ship, bow_position, orientation):
        pass

    def valid_placement(self, ship_size, bow_row, bow_position, orientation):
        """Confirms that a ship has been placed in a legal position

        Args:
            Ship_size: The length of the ship from stem to stern
            Bow_row: The DB row on which the bow is placed
            Bow_position: The index of the DB row on which the bow is placed
            Orientation: can be vertical or horizontal, but the game will
                assume that the ship will always either extend down from the
                bow, or extend to the right from the bow
        Returns:
            Either True or False for legal or illegal placements"""
        if getattr(getattr(self, bow_row), bow_position):
            return False
        if orientation == 'Vertical':
            for x in range(1, ship_size + 1):
                if ship_size + x > 9:
                    return False
                if getattr(getattr(self, bow_row + x), bow_position):
                    return False
        else:
            for x in range(1, ship_size + 1):
                if ship_size + x > 9:
                    return False
                if getattr(getattr(self, bow_row), bow_position + x):
                    return False
        return True

    def mark_board(self, location):
        pass

    def to_form(self):
        pass


class Fleet(ndb.Model):
    """Ships model

    Ship status will be empty until the ship has been placed
    on the board.  Then its status will show as either 'placed'
    or as 'sunk'."""
    carrier_hp          = ndb.IntegerProperty(default=5)
    carrier_status      = ndb.StringProperty()
    battleship_hp       = ndb.IntegerProperty(default=4)
    battleship_status   = ndb.StringProperty()
    cruiser_hp          = ndb.IntegerProperty(default=3)
    cruiser_status      = ndb.StringProperty()
    submarine_hp        = ndb.IntegerProperty(default=3)
    submarine_status    = ndb.StringProperty()
    destroyer_hp        = ndb.IntegerProperty(default=2)
    destroyer_status    = ndb.StringProperty()

    def return_size(self, ship):
        """Returns an integer indicating the size of the ship"""
        sizes = {'carrier': 5,
                'battleship': 4,
                'cruiser': 3,
                'submarine': 3,
                'deestroyer': 2}
        return getattr(sizes, ship)

    def register_hit(self, ship):
        health = getattr(self, ship)
        health -= 1
        setattr(self, ship, health)
        if health < 1:
            return StringMessage(message=str(ship) + ' sunk!')
        else:
            return StringMessage(message=str(ship) + ' hit!')


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


class PlaceShipForm(messages.Message):
    """Used to position a ship on a board"""
    ship = messages.StringField(1, required=True)
    bow_row = messages.IntegerField(2, required=True)
    bow_position = messages.IntegerField(3, required=True)
    orientation = messages.EnumField('Orientation', 4, required=True)


class Orientation(messages.Enum):
    """Ship orientation enumeration values"""
    vertical = 1
    horizontal = 2


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
