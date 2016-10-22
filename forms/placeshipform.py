from protorpc import messages

class PlaceShipForm(messages.Message):
    """Used to position a ship on a board"""
    ship            = messages.StringField(1, required=True)
    bow_row         = messages.IntegerField(2, required=True)
    bow_position    = messages.IntegerField(3, required=True)
    orientation     = messages.StringField(4, required=True)