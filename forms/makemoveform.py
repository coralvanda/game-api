from protorpc import messages

class MakeMoveForm(messages.Message):
    """Used to make a move in an existing game"""
    move_row = messages.IntegerField(1, required=True)
    move_col = messages.IntegerField(2, required=True)