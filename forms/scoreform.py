from protorpc import messages

class ScoreForm(messages.Message):
    """ScoreForm for outbound Score information"""
    user_name   = messages.StringField(1, required=True)
    date        = messages.StringField(2, required=True)
    won         = messages.BooleanField(3, required=True)
    moves       = messages.IntegerField(4, required=True)