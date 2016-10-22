from protorpc import messages

class GameForm(messages.Message):
    """GameForm for outbound game state information"""
    urlsafe_key = messages.StringField(1, required=True)
    game_over   = messages.BooleanField(2, required=True)
    message     = messages.StringField(3, required=True)
    user_name   = messages.StringField(4, required=True)