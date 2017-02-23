'use strict';

var loginDiv;
var usernameDiv;
var homescreenDiv;
var containerDiv = document.getElementById('container');

var view = {

	displayError: function(error) {
		alert(error);
	},

	showLogin: function() {
		// display a text input field and submit button
		loginDiv = document.createElement('DIV');
		loginDiv.id = 'login-div';
		containerDiv.appendChild(loginDiv);

		var userNameInput = document.createElement('INPUT');
		userNameInput.type = 'text';
		userNameInput.id = 'user-name';
		userNameInput.placeholder = 'Enter user name';
		loginDiv.appendChild(userNameInput);

		var loginSubmitBtn = document.createElement('BUTTON');
		loginSubmitBtn.onclick = function() {
			battleshipController.user = userNameInput.value;
			battleshipController.loginUser(userNameInput.value);
			loginDiv.style.display = 'none';
		};

		var registerSubmitBtn = document.createElement('BUTTON');
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
		// use the list of games to show what open games the player has
		// and show a button to create a new game

		// each open game listed should have a button to allow the user
		// to cancel (delete) that game, with a confirmation alert
		homescreenDiv = document.createElement('DIV');
		homescreenDiv.id = 'homescreen-div';
		containerDiv.appendChild(homescreenDiv);

		var newGameBtn = document.createElement('BUTTON');
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
				var gameListItemText = document.createTextNode(
					games[i].urlsafe_key);
				gameListItem.appendChild(gameListItemText);
				openGamesList.appendChild(gameListItem);
			}
		}
		homescreenDiv.appendChild(openGamesList);
	},

	showBoard: function(board) {
		// display the given board or chart
		// build a div containing 10 row divs stacked vertically
		// each row div will contain 10 col divs aligned side-by-side
	},
};