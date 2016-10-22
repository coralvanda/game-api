from datetime import date
from google.appengine.ext import ndb
from user import User
from forms.scoreform import ScoreForm

class Score(ndb.Model):
    """Score object"""
    user    = ndb.KeyProperty(required=True, kind='User')
    date    = ndb.DateProperty(required=True)
    won     = ndb.BooleanProperty(required=True)
    moves   = ndb.IntegerProperty(required=True)

    def to_form(self):
        return ScoreForm(user_name=self.user.get().name, won=self.won,
                         date=str(self.date), moves=self.moves)