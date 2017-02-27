'use strict';

var containerDiv = document.getElementById('container');
var loginDiv;
var usernameDiv;
var homescreenDiv;
var placeShipsDiv;


var view = {

	displayError: function(error) {
		// Displays an alert window containing an error
		alert(error);
	},

	showLogin: function() {
		// display a text input field and buttons to either log in
		// or register a new user
		loginDiv = document.createElement('DIV');
		loginDiv.id = 'login-div';
		containerDiv.appendChild(loginDiv);

		var userNameInput = document.createElement('INPUT');
		userNameInput.type = 'text';
		userNameInput.id = 'username-input';
		userNameInput.placeholder = 'Enter user name';
		loginDiv.appendChild(userNameInput);

		var loginSubmitBtn = document.createElement('DIV');
		loginSubmitBtn.className = 'button';
		loginSubmitBtn.onclick = function() {
			battleshipController.user = userNameInput.value;
			battleshipController.loginUser(userNameInput.value);
			loginDiv.style.display = 'none';
		};

		var registerSubmitBtn = document.createElement('DIV');
		registerSubmitBtn.className = 'button';
		registerSubmitBtn.onclick = function() {
			battleshipController.user = userNameInput.value;
			battleshipController.registerUser();
			loginDiv.style.display = 'none';
		}

		var loginSubmitBtnText = document.createTextNode('Login');
		var registerSubmitBtnText = document.createTextNode('Register');

		loginSubmitBtn.appendChild(loginSubmitBtnText);
		registerSubmitBtn.appendChild(registerSubmitBtnText);

		loginDiv.appendChild(loginSubmitBtn);
		loginDiv.appendChild(registerSubmitBtn);
	},

	showUsername: function() {
		// Shows the active user at the top of the screen
		usernameDiv = document.createElement('DIV');
		usernameDiv.id = 'username-div';
		containerDiv.appendChild(usernameDiv);

		var usernameHeader = document.createElement('H3');
		var usernameHeaderText = document.createTextNode(
			'Playing as user: ' + battleshipController.user);
		usernameHeader.appendChild(usernameHeaderText);
		usernameDiv.appendChild(usernameHeader);
	},

	showHomeScreen: function() {
		// Displays the user's home screen, which includes a 'new game'
		// button, and list of active games

		// each open game listed should have a button to allow the user
		// to cancel (delete) that game, with a confirmation alert
		homescreenDiv = document.createElement('DIV');
		homescreenDiv.id = 'homescreen-div';
		containerDiv.appendChild(homescreenDiv);

		var newGameBtn = document.createElement('DIV');
		newGameBtn.className = 'button';
		newGameBtn.onclick = function() {
			battleshipController.newGame();
			homescreenDiv.style.display = 'none';
		};

		var newGameBtnText = document.createTextNode('New Game');
		newGameBtn.appendChild(newGameBtnText);
		homescreenDiv.appendChild(newGameBtn);

		battleshipController.getPlayerGames();
	},

	showHomeScreenGamesList: function(optionalText=false) {
		// Builds and displays the list of actives games for the user
		var openGamesList = document.createElement('OL');
		if (optionalText) {
			var noGameFoundItem = document.createElement('LI');
			var noGameFoundItemText = document.createTextNode(optionalText);
			noGameFoundItem.appendChild(noGameFoundItemText);
			openGamesList.appendChild(noGameFoundItem);
		}
		else {
			var games = battleshipController.playerGamesList;
			for (var i = 0; i < games.length; i++) {
				var gameListItem = document.createElement('LI');
				gameListItem.className = 'game-list-item';
				var gameItemDiv = document.createElement('DIV');
				gameItemDiv.className = 'game-item-div';
				var gameItemP = document.createElement('P');
				gameItemP.className = 'game-item-p';
				var gameListItemText = document.createTextNode(
					games[i].urlsafe_key);
				gameItemP.appendChild(gameListItemText);
				gameItemDiv.appendChild(gameItemP);
				gameListItem.appendChild(gameItemDiv);
				openGamesList.appendChild(gameListItem);

				var cancelGameBtn = document.createElement('DIV');
				cancelGameBtn.className = 'game-cancel button';
				var cancelGameBtnText = document.createTextNode('Cancel');
				cancelGameBtn.appendChild(cancelGameBtnText);
				gameItemDiv.appendChild(cancelGameBtn);
			}
		}
		homescreenDiv.appendChild(openGamesList);
	},

	showPlaceShips: function(response) {
		// Displays the user's board and available ships which must be placed
		homescreenDiv.style.display = 'none';

		placeShipsDiv = document.createElement('DIV');
		placeShipsDiv.id = 'place-ships-div';
		containerDiv.appendChild(placeShipsDiv);

		var gameKey = response.urlsafe_key;
		battleshipController.getBoard(gameKey, 'user_board');
	},

	showBoard: function(board) {
		// Displays the given board or chart

		// build a div containing 10 row divs stacked vertically
		// each row div will contain 10 col divs aligned side-by-side
		for (var i = 0; i < board.length; i++) {
			var row = document.createElement('DIV');
			var junk = document.createTextNode(board[i]); // clean up later
			row.appendChild(junk);
			placeShipsDiv.appendChild(row);
		}
	},
};