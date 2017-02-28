'use strict';

var gameKey, board, chart;
var newGameBtn;
var requestPath = '/_ah/api/battleship/v1/';

var battleshipController = {

	user: '',
	activeGame: {
		key: '',
		allShipsPlaced: false
	},
	playerGamesList: [],

	init: function() {
		var userCookie = battleshipController.getCookie('activeUser');
		var gameCookie = battleshipController.getCookie('activeGame');
		if (gameCookie && userCookie) {
			battleshipController.user = userCookie;
			battleshipController.activeGame.key = gameCookie;
			battleshipController.playGame(gameCookie);
		}
		else if (userCookie) {
			battleshipController.user = userCookie;
			battleshipController.userWelcome();
			battleshipController.homeScreen();
		}
		else {
			view.showLogin();
		}
	},

	setCookie: function(name, value, days) {
		var expires = '';
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days*24*60*60*1000));
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
		battleshipController.setCookie('activeUser',
			battleshipController.user, 10);
		battleshipController.userWelcome();
		battleshipController.homeScreen();
	},

	logoutUser: function() {
		battleshipController.clearCookie('activeUser');
		battleshipController.user = '';
		view.refreshPage();
	},

	userWelcome: function() {
		view.showUserBanner();
	},

	homeScreen: function() {
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
					var gameKey = JSON.parse(xhttp.responseText).urlsafe_key;
					battleshipController.setCookie('activeGame',
						gameKey, 10);
					battleshipController.activeGame.key = gameKey;
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

	 checkShipPlacement: function(gameKey) {
	 	var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == XMLHttpRequest.DONE) {
				if (xhttp.status == 200) {
					var shipPlacements = JSON.parse(
						xhttp.responseText).condition.slice(5);
					for (var i = 0; i < shipPlacements.length; i++) {
						if (shipPlacements[i].indexOf('Not placed') > -1){
							return false;
						}
					}
					return true;
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'game/' + gameKey +
			'/fleet?fleet=user_fleet', false);
		xhttp.send();
	 },

	getShipPlacementStatus: function(gameKey, fleet) {
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

	playGame: function(gameKey) {
		// first need to check state of game
		// then must direct to proper display based on state
		battleshipController.activeGame.key = gameKey;
		battleshipController.setCookie('activeGame', gameKey, 10);
		if (battleshipController.checkShipPlacement) {
			// play game
		}
		else {
			view.showPlaceShips()
		}



		chart = null; // show_board_AJAX_call;
		board = null; // show_board_AJAX_call;
		view.showBoard(chart);
		view.showBoard(board);
		// place a link to return the player to their home screen
		// when player clicks on the chart, call the make_move endpoint
		// if game ends after a move, exit the loop
		// else run the loop again
	},
};

battleshipController.init();