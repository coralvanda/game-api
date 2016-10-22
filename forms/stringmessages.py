from protorpc import messages

class StringMessages(messages.Message):
    """Outbound (multiple) string message"""
    items = messages.StringField(1, repeated=True)