from google.appengine.ext import ndb
from protorpc import messages
from forms.fleetstatusform import FleetStatusForm

class Fleet(ndb.Model):
    """Ships model

    Ship status will be the empty string until the ship has been placed
    on the board.  Then its status will show as either 'placed'
    or as 'sunk'."""
    carrier_hp          = ndb.IntegerProperty(default=5)
    carrier_status      = ndb.StringProperty(default='')
    battleship_hp       = ndb.IntegerProperty(default=4)
    battleship_status   = ndb.StringProperty(default='')
    cruiser_hp          = ndb.IntegerProperty(default=3)
    cruiser_status      = ndb.StringProperty(default='')
    submarine_hp        = ndb.IntegerProperty(default=3)
    submarine_status    = ndb.StringProperty(default='')
    destroyer_hp        = ndb.IntegerProperty(default=2)
    destroyer_status    = ndb.StringProperty(default='')

    def return_size(self, ship):
        """Returns an integer indicating the size of the ship"""
        sizes = {'carrier': 5,
                'battleship': 4,
                'cruiser': 3,
                'submarine': 3,
                'destroyer': 2}
        return sizes[ship]

    def register_hit(self, ship):
        health = getattr(self, ship + '_hp')
        health -= 1
        setattr(self, ship, health)
        self.put()
        if health < 1:
            return StringMessage(message=str(ship) + ' sunk!')
        else:
            return StringMessage(message=str(ship) + ' hit!')

    def fleet_status(self):
        form = FleetStatusForm()
        if (self.carrier_hp == 0) and (self.battleship_hp == 0) \
            and (self.cruiser_hp == 0) and (self.submarine_hp == 0) \
            and (self.destroyer_hp == 0):
            form.condition = ['Fleet destroyed']
            return form
        else:
            carrier_condition = 'Carrier HP ' + str(self.carrier_hp)
            battleship_condition = 'Battleship HP ' + str(self.battleship_hp)
            cruiser_condition = 'Cruiser HP: ' + str(self.cruiser_hp)
            submarine_condition = 'Submarine HP ' + str(self.submarine_hp)
            destroyer_condition = 'Destroyer HP ' + str(self.destroyer_hp)
            form.condition = [carrier_condition, battleship_condition,
                cruiser_condition, submarine_condition, destroyer_condition]
            return form