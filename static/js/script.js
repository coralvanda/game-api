'use strict';

var gameKey, board, chart;
var newGameBtn;
var requestPath = '/_ah/api/battleship/v1/';

var battleshipCtrl = {

	user: '',
	activeGame: '',
	playerGamesList: [],
	shipStatuses: [],
	placeShipOrientation: 'vertical',

	init: function() {
		// Determins initial UI state to display upon new page load
		var userCookie = battleshipCtrl.getCookie('activeUser');
		var gameCookie = battleshipCtrl.getCookie('activeGame');
		if (gameCookie && userCookie) {
			battleshipCtrl.user = userCookie;
			view.showUserBanner();
			battleshipCtrl.resumeGame(gameCookie);
		}
		else if (userCookie) {
			battleshipCtrl.user = userCookie;
			view.showUserBanner();
			battleshipCtrl.homeScreen();
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
		battleshipCtrl.setCookie(name, '', -1);
	},

	registerUser: function() {
		// Calls API to register a new user in the database
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					battleshipCtrl.loginUser();
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('POST', requestPath + 'user?user_name=' +
			battleshipCtrl.user, true);
		xhttp.send();
	},

	loginUser: function() {
		// Sets an active user
		battleshipCtrl.setCookie('activeUser',
			battleshipCtrl.user, 10);
		view.showUserBanner();
		battleshipCtrl.homeScreen();
	},

	logoutUser: function() {
		// Clears the active user
		battleshipCtrl.clearCookie('activeUser');
		battleshipCtrl.user = '';
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
					battleshipCtrl.playerGamesList = gamesObj.games;
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
			battleshipCtrl.user, true);
		xhttp.send();
	},

	newGame: function() {
		// Calls API to begin a new game, tells view to show placements
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var gameKey = JSON.parse(xhttp.responseText).urlsafe_key;
					battleshipCtrl.setCookie('activeGame',
						gameKey, 10);
					battleshipCtrl.activeGame = gameKey;
					view.showPlaceShips(gameKey);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		var requestOjb = {"user_name": battleshipCtrl.user};
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
					battleshipCtrl.shipStatuses = shipPlacements;
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
		battleshipCtrl.activeGame = gameKey;
		battleshipCtrl.setCookie('activeGame', gameKey, 10);

		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var shipPlacements = JSON.parse(
						xhttp.responseText).condition.slice(5);
					for (var i = 0; i < shipPlacements.length; i++) {
						if (shipPlacements[i].indexOf('Not placed') > -1) {
							view.showPlaceShips(gameKey);
							return null;
						}
					}
					battleshipCtrl.playGame(gameKey);
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
		chart = battleshipCtrl.getBoard(gameKey, 'user_chart');
		board = battleshipCtrl.getBoard(gameKey, 'user_board');
		view.showBoard(chart);
		view.showBoard(board);
		// place a link to return the player to their home screen
		// when player clicks on the chart, call the make_move endpoint
		// if game ends after a move, exit the loop
		// else run the loop again
	},
};

battleshipCtrl.init();