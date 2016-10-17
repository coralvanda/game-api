"""utils.py - File for collecting general utility functions."""

import logging
import random
from google.appengine.ext import ndb
import endpoints

def get_by_urlsafe(urlsafe, model):
    """Returns an ndb.Model entity that the urlsafe key points to. Checks
        that the type of entity returned is of the correct kind. Raises an
        error if the key String is malformed or the entity is of the incorrect
        kind
    Args:
        urlsafe: A urlsafe key string
        model: The expected entity kind
    Returns:
        The entity that the urlsafe Key string points to or None if no entity
        exists.
    Raises:
        ValueError:"""
    try:
        key = ndb.Key(urlsafe=urlsafe)
    except TypeError:
        raise endpoints.BadRequestException('Invalid Key')
    except Exception, e:
        if e.__class__.__name__ == 'ProtocolBufferDecodeError':
            raise endpoints.BadRequestException('Invalid Key')
        else:
            raise

    entity = key.get()
    if not entity:
        return None
    if not isinstance(entity, model):
        raise ValueError('Incorrect Kind')
    return entity


def ai_fleet_builder():
    config_1 = [
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
        ['C', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
        ['C', 'B', 'D', 'D', '0', '0', '0', '0', '0', '0'],
        ['C', 'B', 'c', 'S', '0', '0', '0', '0', '0', '0'],
        ['C', 'B', 'c', 'S', '0', '0', '0', '0', '0', '0'],
        ['C', 'B', 'c', 'S', '0', '0', '0', '0', '0', '0']
    ]
    config_2 = [
        ['0', 'C', '0', 'B', '0', 'c', '0', 's', '0', '0']
        ['0', 'C', '0', 'B', '0', 'c', '0', 's', '0', '0']
        ['0', 'C', '0', 'B', '0', 'c', '0', 's', '0', '0']
        ['0', 'C', '0', 'B', '0', '0', '0', '0', '0', '0']
        ['0', 'C', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', 'D', 'D', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
    ]
    config_3 = [
        ['0', '0', '0', '0', 'S', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', 'S', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', 'S', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['B', 'B', 'B', 'B', '0', 'D', '0', 'c', 'c', 'c']
        ['0', '0', '0', '0', '0', 'D', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', 'C', 'C', 'C', 'C', 'C', '0', '0']
    ]
    config_4 = [
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', 'D', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', 'D', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', 'B', '0', '0', '0', '0', '0']
        ['0', '0', 'S', '0', 'B', '0', 'c', '0', '0', '0']
        ['0', '0', 'S', '0', 'B', '0', 'c', '0', '0', '0']
        ['0', '0', 'S', '0', 'B', '0', 'c', '0', '0', '0']
        ['0', '0', 'C', 'C', 'C', 'C', 'C', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
    ]
    config_5 = [
        ['0', '0', '0', '0', '0', '0', 'D', 'B', '0', '0']
        ['0', '0', '0', '0', '0', '0', 'D', 'B', '0', '0']
        ['0', '0', '0', '0', '0', '0', 'C', 'B', '0', '0']
        ['0', '0', '0', '0', '0', '0', 'C', 'B', 'c', '0']
        ['0', '0', '0', '0', '0', '0', 'C', '0', 'c', '0']
        ['0', '0', '0', '0', '0', '0', 'C', '0', 'c', '0']
        ['0', '0', '0', '0', '0', '0', 'C', 'S', 'S', 'S']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
    ]
    fleets = [config_1, config_2, config_3, config_4, config_5]
    return random.choice(fleets)