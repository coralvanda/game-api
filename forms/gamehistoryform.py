from protorpc import messages

class GameHistoryForm(messages.Message):
    moves = messages.StringField(1, repeated=True)