from protorpc import messages

class FleetStatusForm(messages.Message):
    condition = messages.StringField(1, repeated=True)