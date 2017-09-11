# Battleship

## Known bugs:
Upon registering a new user, the site will display an error that the user was not 
found, but it will proceed correctly. The cause of the bug has been indentified 
and a fix is coming ASAP.

## Update:
The project now includes a front-end written in JavaScript that accesses
the API to make the full experience of playing a game simple and easy
from any device.

## What is it?
This is a project created for the Udacity Full Stack Developer
Nanodegree program.  It uses the Python version of Google App Engine
and Datastore to create a back end with endpoints to allow a user
to play a game of battleship against a computer opponent.

## Set-Up Instructions:
 1. Update the value of application in app.yaml to the app ID you have
registered in the App Engine admin console and would like to use to host
your instance of this app.
 2. Run the app with the devserver using dev_appserver.py DIR, and
ensure it's running by visiting the API Explorer - by default
localhost:8080/_ah/api/explorer.

## Game Description:
Battleship is played by first placing 5 different types of ships, in
this game called 'carrier', 'battleship', 'cruiser', 'submarine', and
'destroyer', on a board that is 10x10 in size.  After all ships are
placed, the player may begin entering coordinates to fire upon, attemping
to hit the enemy ships.  The computer gets one shot in return for each
shot the player takes.  A ship is considered 'sunk' when each coordinate
on the board where that ship was placed has been hit.  Whoever sinks
all of their opponent's ships first, wins.

## Files Included:
 - api.py: Contains endpoints and game-playing logic.
 - app.yaml: App configuration.
 - cron.yaml: Cronjob configuration.
 - index.yaml: Contains properties which are used during queries.
 - main.py: Handler for taskqueue handler.
 - models.py: Entity and message definitions including helper methods.
 - utils.py: Helper function for retrieving ndb.Models by urlsafe Key
 string and building computer fleet formations.

## Endpoints Included:
 - **create_user**
    - Path: 'user'
    - Method: POST
    - Parameters: user_name, email (optional)
    - Returns: Message confirming creation of the User.
    - Description: Creates a new User. user_name provided must be
    unique. Will raise a ConflictException if a User with that user_name
    already exists.

 - **new_game**
    - Path: 'game'
    - Method: POST
    - Parameters: user_name
    - Returns: GameForm
    - Description: Creates a new Game. user_name provided must
    correspond to an existing user - will raise a NotFoundException if
    not.

 - **get_game**
    - Path: 'game/{urlsafe_game_key}'
    - Method: GET
    - Parameters: urlsafe_game_key
    - Returns: GameForm
    - Description: Returns the current state of a game.

 - **get_games_by_player**
    - Path: 'games/player'
    - Method: 'GET'
    - Parameters: user_name
    - Returns: GameForms
    - Description: Return a list of active games a player is engaged in

 - **place_ship**
    - Path: game/{urlsafe_game_key}/place_ship
    - Method: 'POST'
    - Parameters: urlsafe_game_key, ship, bow_row, bow_position,
    orientation
    - Returns: StringMessage
    - Description: Position a ship on your board.  Will raise a
    BadRequestException if the entered ship type is invalid, or if the
    entered position for the ship is not valid.

 - **show_board**
    - Path: game/{urlsafe_game_key}/board
    - Method: 'POST'
    - Parameters: urlsafe_game_key, board
    - Returns: StringMessage
    - Description: Display a board state

 - **view_fleet_health**
    - Path: game/{urlsafe_game_key}/board
    - Method: 'POST'
    - Parameters: urlsafe_game_key, fleet
    - Returns: FleetStatusForm
    - Description: Returns a form displaying the current status of a
    fleet

 - **make_move**
    - Path: 'game/{urlsafe_game_key}'
    - Method: PUT
    - Parameters: urlsafe_game_key, move_row, move_col
    - Returns: GameForm with new game state.
    - Description: Accepts move coordinates and returns the updated
    state of the game, including the computer player's move. If this
    causes a game to end, a corresponding Score entity will be created.
    Will raise a BadRequestException if a move is attempted before
    placing all ships, if the entered coordinates are not valid, or if
    the player has previously entered the same coordinates in that game.

 - **get_scores**
    - Path: 'scores'
    - Method: GET
    - Parameters: None
    - Returns: ScoreForms.
    - Description: Returns all Scores in the database (unordered).

 - **get_user_scores**
    - Path: 'scores/user/{user_name}'
    - Method: GET
    - Parameters: user_name
    - Returns: ScoreForms.
    - Description: Returns all Scores recorded by the provided player
    (unordered). Will raise a NotFoundException if the User does not
    exist.

 - **get_top_scores**
    - Path: 'top-scores'
    - Method: 'GET'
    - Parameters: None
    - Returns: ScoreForms
    - Description: Returns the top 10 scores

 - **cancel_game**
    - Path: game/{urlsafe_game_key}/cancel
    - Method: 'POST'
    - Parameters: urlsafe_game_key
    - Returns: StringMessage
    - Description: Allows a user to cancel a game in progress. Will raise
    a BadRequestException if an attempt is made to cancel a completed
    game

 - **get_user_rankings**
    - Path: rankings
    - Method: 'GET'
    - Parameters: None
    - Returns: StringMessages
    - Description: Returns a list of users ranked by win percentage, with
    ties broken by average number of moves played

 - **get_game_history**
    - Path: game/{urlsafe_game_key}/history
    - Method: 'GET'
    - Parameters: urlsafe_game_key
    - Returns: GameHistoryForm
    - Description: Returns a play-by-play history of a given game


## Models Included:
 - **User**
    - Stores unique user_name and (optional) email address.

 - **Game**
    - Stores unique game states. Associated with User model,
    Board model, and Fleet model via KeyProperties.

 - **Board**
    - Stores a single board state, repeated 4 times for a given game

 - **Fleet**
    - Stores a single fleet state, repeated 2 times for a given game

 - **Score**
    - Records completed games. Associated with Users model via KeyProperty.

## Forms Included:
 - **GameForm**
    - Representation of a Game's state (urlsafe_key, attempts_remaining,
    game_over flag, message, user_name).
 - **GameForms**
    - A list of representations of game states
 - **NewGameForm**
    - Used to create a new game (user_name)
 - **PlaceShipForm**
    - Used to allow a player to indicate where a particular ship should
    be positioned on the board (ship, bow_row, bow_position, orientation)
 - **BoardForm**
    - Used to represent the state of a particular board in a game
 - **MakeMoveForm**
    - Inbound make move form (move_row, move_col).
 - **FleetStatusForm**
    - Used to displayed the health of all ships in a fleet (as list of
     strings)
 - **GameHistoryForm**
    - Used to display all moves made so far in a given game (as list of
    strings)
 - **ScoreForm**
    - Representation of a completed game's Score (user_name, date,
    won flag, move count).
 - **ScoreForms**
    - Multiple ScoreForm container.
 - **StringMessage**
    - General purpose String container.
 - **StringMessages**
    - General purpose list of Strings container.
