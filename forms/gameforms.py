from protorpc import messages
from gameform import GameForm

class GameForms(messages.Message):
    games = messages.MessageField(GameForm, 1, repeated=True)