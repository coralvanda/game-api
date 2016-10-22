from protorpc import messages

class BoardForm(messages.Message):
    """Used to show a board state"""
    row_0 = messages.StringField(1)
    row_1 = messages.StringField(2)
    row_2 = messages.StringField(3)
    row_3 = messages.StringField(4)
    row_4 = messages.StringField(5)
    row_5 = messages.StringField(6)
    row_6 = messages.StringField(7)
    row_7 = messages.StringField(8)
    row_8 = messages.StringField(9)
    row_9 = messages.StringField(10)