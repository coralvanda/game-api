'use strict';

var gameKey, board, chart;
var newGameBtn;
var requestPath = '/_ah/api/battleship/v1/';

var battleshipController = {

	user: '',
	activeGame: '',
	playerGamesList: [],

	init: function() {
		// Determins initial UI state to display upon new page load
		var userCookie = battleshipController.getCookie('activeUser');
		var gameCookie = battleshipController.getCookie('activeGame');
		if (gameCookie && userCookie) {
			battleshipController.user = userCookie;
			view.showUserBanner();
			battleshipController.resumeGame(gameCookie);
		}
		else if (userCookie) {
			battleshipController.user = userCookie;
			view.showUserBanner();
			battleshipController.homeScreen();
		}
		else {
			view.showLogin();
		}
	},

	setCookie: function(name, value, days) {
		// Sets a cookie with the given name, value, and days before expiration
		var expires = '';
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days*24*60*60*1000));
			expires = '; expires=' + date.toUTCString();
		}
		document.cookie = name + '=' + value + expires + '; path=/';
	},

	getCookie: function(name) {
		// Returns a cookie based on provided name, if it exists
		var nameEquals = name + '=';
		var attributes = document.cookie.split(';');
		for (var i = 0; i < attributes.length; i++) {
			var crumb = attributes[i];
			while (crumb.charAt(0) == ' ') {
				crumb = crumb.substring(1, crumb.length);
			}
			if (crumb.indexOf(nameEquals) == 0) {
				return crumb.substring(nameEquals.length, crumb.length);
			}
		}
	},

	clearCookie: function(name) {
		battleshipController.setCookie(name, '', -1);
	},

	registerUser: function() {
		// Calls API to register a new user in the database
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					battleshipController.loginUser();
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
		// Sets an active user
		battleshipController.setCookie('activeUser',
			battleshipController.user, 10);
		view.showUserBanner();
		battleshipController.homeScreen();
	},

	logoutUser: function() {
		// Clears the active user
		battleshipController.clearCookie('activeUser');
		battleshipController.user = '';
		view.refreshPage();
	},

	homeScreen: function() {
		// Tells view to show the home screen
		view.showHomeScreen();
	},

	getPlayerGames: function() {
		// Calls API to get all active player games, tells view to show them
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
		// Calls API to begin a new game, tells view to show placements
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var gameKey = JSON.parse(xhttp.responseText).urlsafe_key;
					battleshipController.setCookie('activeGame',
						gameKey, 10);
					battleshipController.activeGame = gameKey;
					view.showPlaceShips(gameKey);
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
		// Calls API to cancel a game based on given key
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
		// Calls API and sends the view a board object
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

	getShipPlacementStatus: function(gameKey, fleet) {
		// Calls API and sends the view the ships' statuses
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var shipPlacements = JSON.parse(
						xhttp.responseText).condition.slice(5);
					view.showShipPlacementStatus(shipPlacements);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'game/' + gameKey +
			'/fleet?fleet=' + fleet, true);
		xhttp.send();
	},

	placeShip: function() {
		gameKey = null // urlsafegamekey;
		board = null // show_board_AJAX_call;
		view.showBoard(board);
		// list of ships available
		// move on when all ships have been placed
	},

	resumeGame: function(gameKey) {
		// Checks the state of the game, and picks up where things left off
		battleshipController.activeGame = gameKey;
		battleshipController.setCookie('activeGame', gameKey, 10);

		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var shipPlacements = JSON.parse(
						xhttp.responseText).condition.slice(5);
					for (var i = 0; i < shipPlacements.length; i++) {
						if (shipPlacements[i].indexOf('Not placed') > -1) {
							view.showPlaceShips(gameKey);
							break;
						}
					}
					battleshipController.playGame(gameKey);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'game/' + gameKey +
			'/fleet?fleet=user_fleet', true);
		xhttp.send();
	},

	playGame: function(gameKey) {
		// play game
		chart = battleshipController.getBoard(gameKey, 'user_chart');
		board = battleshipController.getBoard(gameKey, 'user_board');
		view.showBoard(chart);
		view.showBoard(board);
		// place a link to return the player to their home screen
		// when player clicks on the chart, call the make_move endpoint
		// if game ends after a move, exit the loop
		// else run the loop again
	},
};

battleshipController.init();