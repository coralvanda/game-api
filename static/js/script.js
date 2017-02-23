'use strict';

var gameKey, board, chart;
var newGameBtn;
var requestPath = '/_ah/api/battleship/v1/';

var battleshipController = {

	user: '',
	playerGamesList: [],

	init: function() {
		view.showLogin();
	},

	registerUser: function() {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					view.loginUser(battleshipController.user);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('POST', requestPath + 'user?user_name=' +
			battleshipController.user, true);
		xhttp.send();
	},

	loginUser: function(username) {
		battleshipController.userWelcome();
		battleshipController.homeScreen();
	},

	userWelcome: function() {
		view.showUsername();
	},

	homeScreen: function() {
		// with data from get_games_by_player, show the home screen
		view.showHomeScreen();
	},

	getPlayerGames: function() {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var gamesObj = JSON.parse(xhttp.responseText);
					battleshipController.playerGamesList = gamesObj.games;
					view.showHomeScreenGamesList();
				}
				else if (xhttp.status == 404) {
					view.showHomeScreenGamesList('No games found');
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'games/player?user_name=' +
			battleshipController.user, true);
		xhttp.send();
	},

	newGame: function() {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					// stuff
				}
				else if (xhttp.status == 404) {
					// stuff
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('POST', requestPath + 'game', true);
		xhttp.send({"user_name": battleshipController.user});
	},

	placeShips: function() {
		if (newGameBtn) {
			// call new_game endpoint
			gameKey = null // urlsafegamekey;
			// display user board, and ships which can be placed
			// use show_board endpoint
			board = null // show_board_AJAX_call;
			view.showBoard(board);
			// list of ships available
			// move on when all ships have been placed
		}
	},

	playGame: function() {
		while (gameKey !== '') {
			chart = null // show_board_AJAX_call;
			board = null // show_board_AJAX_call;
			view.showBoard(chart);
			view.showBoard(board);
			// place a link to return the player to their home screen
			// when player clicks on the chart, call the make_move endpoint
			// if game ends after a move, exit the loop
			// else run the loop again
		}
	},
};

battleshipController.init();