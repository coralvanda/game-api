from google.appengine.ext import ndb
from datetime import date
from user import User
from fleet import Fleet
from board import Board
from score import Score
from forms.gameform import GameForm
from forms.gamehistoryform import GameHistoryForm

class Game(ndb.Model):
    """Game object"""
    move_count  = ndb.IntegerProperty(default=0)
    game_over   = ndb.BooleanProperty(required=True, default=False)
    user        = ndb.KeyProperty(required=True, kind='User')
    user_fleet  = ndb.KeyProperty(kind='Fleet')
    user_board  = ndb.KeyProperty(kind='Board')
    user_chart  = ndb.KeyProperty(kind='Board')
    ai_fleet    = ndb.KeyProperty(kind='Fleet')
    ai_board    = ndb.KeyProperty(kind='Board')
    ai_chart    = ndb.KeyProperty(kind='Board')
    move_hist   = ndb.StringProperty(repeated=True)

    @classmethod
    @ndb.transactional(xg=True)
    def new_game(cls, user):
        """Creates and returns a new game"""
        user_fleet = Fleet()
        user_board = Board()
        user_chart = Board()
        ai_fleet = Fleet()
        ai_board = Board()
        ai_chart = Board()
        user_fleet_key = user_fleet.put()
        user_board_key = user_board.put()
        user_chart_key = user_chart.put()
        ai_fleet_key = ai_fleet.put()
        ai_board_key = ai_board.put()
        ai_chart_key = ai_chart.put()
        game = Game(user=user,
                    user_fleet=user_fleet_key,
                    user_board=user_board_key,
                    user_chart=user_chart_key,
                    ai_fleet=ai_fleet_key,
                    ai_board=ai_board_key,
                    ai_chart=ai_chart_key,
                    game_over=False)
        game.put()
        user_board.build_board()
        user_chart.build_board()
        ai_board.build_board()
        ai_chart.build_board()
        return game

    def to_form(self, message):
        """Returns a GameForm representation of the Game"""
        form = GameForm()
        form.urlsafe_key = self.key.urlsafe()
        form.user_name = self.user.get().name
        form.game_over = self.game_over
        form.message = message
        return form

    def return_history(self):
        """Returns a GameHistoryForm with the moves of the game"""
        return GameHistoryForm(moves=[move for move in self.move_hist])

    def end_game(self, won=False):
        """Adds completed game to the score board

        If won is True, the player won. - if won is False, the player lost."""
        score = Score(user=self.user, date=date.today(), won=won,
                      moves=self.move_count)
        score.put()