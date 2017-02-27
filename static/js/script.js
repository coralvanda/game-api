'use strict';

var gameKey, board, chart;
var newGameBtn;
var requestPath = '/_ah/api/battleship/v1/';

var battleshipController = {

	user: '',
	playerGamesList: [],

	init: function() {
		var cookie = battleshipController.getCookie('activeUser');
		if (cookie) {
			battleshipController.user = cookie;
			battleshipController.userWelcome();
			battleshipController.homeScreen();
		}
		else {
			view.showLogin();
		}
	},

	setCookie: function(name, value, expiration) {
		var expires = '';
		if (expiration) {
			var date = new Date();
			date.setTime(date.getTime() + (expiration*24*60*60*1000));
			expires = '; expires=' + date.toUTCString();
		}
		document.cookie = name + '=' + value + expires + '; path=/';
	},

	getCookie: function(name) {
		var nameEquals = name + '=';
		var attributes = document.cookie.split(';');
		for (var i = 0; i < attributes.length; i++) {
			var crumb = attributes[i];
			while (crumb.charAt(0) == ' ') {
				crumb = crumb.substring(1, crumb.length());
			}
			if (crumb.indexOf(nameEquals) == 0) {
				return crumb.substring(nameEquals.length, crumb.length);
			}
		}
	},

	clearCookie: function() {
		null;
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

	loginUser: function() {
		battleshipController.setCookie('activeUser');
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
					view.showPlaceShips(JSON.parse(xhttp.responseText));
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		var requestOjb = {"user_name": battleshipController.user};
		xhttp.open('POST', requestPath + 'game', true);
		xhttp.send(JSON.stringify(requestOjb));
	},

	cancelGame: function(gameKey) {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					view.refreshPage();
					view.showHomeScreenGamesList();
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('POST', requestPath + 'game/' + gameKey + '/cancel', true);
		xhttp.send();
	},

	getBoard: function(gameKey, boardType) {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					view.showBoard(JSON.parse(xhttp.responseText).items);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('POST', requestPath + 'game/' + gameKey +
			'/board?board=' + boardType, true);
		xhttp.send();
	},

	placeShip: function() {
		gameKey = null // urlsafegamekey;
		board = null // show_board_AJAX_call;
		view.showBoard(board);
		// list of ships available
		// move on when all ships have been placed
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