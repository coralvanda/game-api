from google.appengine.ext import ndb
from forms.boardform import BoardForm

class Board(ndb.Model):
    """Board object"""
    row_0 = ndb.StringProperty(repeated=True)
    row_1 = ndb.StringProperty(repeated=True)
    row_2 = ndb.StringProperty(repeated=True)
    row_3 = ndb.StringProperty(repeated=True)
    row_4 = ndb.StringProperty(repeated=True)
    row_5 = ndb.StringProperty(repeated=True)
    row_6 = ndb.StringProperty(repeated=True)
    row_7 = ndb.StringProperty(repeated=True)
    row_8 = ndb.StringProperty(repeated=True)
    row_9 = ndb.StringProperty(repeated=True)

    def build_board(self):
        for x in range(10):
            content = ['0' for _ in range(10)]
            setattr(self, 'row_' + str(x), content)
        self.put()

    def mark_board(self, location):
        pass

    def to_form(self):
        form = BoardForm()
        form.row_0 = ''.join(self.row_0)
        form.row_1 = ''.join(self.row_1)
        form.row_2 = ''.join(self.row_2)
        form.row_3 = ''.join(self.row_3)
        form.row_4 = ''.join(self.row_4)
        form.row_5 = ''.join(self.row_5)
        form.row_6 = ''.join(self.row_6)
        form.row_7 = ''.join(self.row_7)
        form.row_8 = ''.join(self.row_8)
        form.row_9 = ''.join(self.row_9)
        return form