'use strict';

var gameKey, board, chart;
var newGameBtn;
var requestPath = '/_ah/api/battleship/v1/';

var battleshipCtrl = {

	user: '',
	activeGame: '',
	playerGamesList: [],
	shipStatuses: {},
	gamePhase: '',
	placeShipOrientation: 'horizontal',

	init: function() {
		// Determins initial UI state to display upon new page load
		var userCookie = battleshipCtrl.getCookie('name');
		var gameCookie = battleshipCtrl.getCookie('activeGame');
		if (gameCookie && userCookie) {
			battleshipCtrl.user = userCookie.split('|')[0];
			view.showUserBanner();
			battleshipCtrl.resumeGame(gameCookie);
		}
		else if (userCookie) {
			battleshipCtrl.user = userCookie.split('|')[0];
			view.showUserBanner();
			view.showHomeScreen();
		}
		else {
			view.showWelcome();
		}
	},

	validUsername: function(username) {
		// Confirms that a given username conforms to my requirements
		var userRegex = /[a-zA-Z0-9_-]{3,20}$/;
		return userRegex.test(username);
	},

	validPassword: function(password) {
		// Confirms that a given password conforms to my requirements
		var pwRegex = /^.{3,20}$/;
		return pwRegex.test(password);
	},

	validEmail: function(email) {
		// Confirms that a given email is probably valid
		var emailRegex = /^[\S]+@[\S]+\.[\S]+$/;
		return emailRegex.test(email);
	},

	hashStr: function(s) {
		// Returns a hashed version of the input string
		var hash = CryptoJS.SHA256(s);
		return hash.toString(CryptoJS.enc.Hex);
	},

	makeSecureVal: function(s) {
		// Returns the given string and its hashed version as a single string
		return "%1|%2".replace('%1', s).replace('%2', battleshipCtrl.hashStr(s));
	},

	checkSecureVal: function(h) {
		// Confirms that a given string/hash pair is valid
		var val = h.split("|")[0];
		if (h === battleshipCtrl.makeSecureVal(val)) {
			return val;
		}
	},

	checkLogin: function(cookie) {
		// Checks for a logged-in user based on the stored cookie,
		// and returns the username if logged in
		if (cookie) {
			return battleshipCtrl.checkSecureVal(cookie);
		}
		else {
			return false;
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
			while (crumb.charAt(0) === ' ') {
				crumb = crumb.substring(1, crumb.length);
			}
			if (crumb.indexOf(nameEquals) === 0) {
				return crumb.substring(nameEquals.length, crumb.length);
			}
		}
	},

	clearCookie: function(name) {
		battleshipCtrl.setCookie(name, '', -1);
	},

	registerUser: function(name, pw) {
		// Calls API to register a new user in the database
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					battleshipCtrl.user = name;
					var cookieVal = battleshipCtrl.makeSecureVal(name);
        			battleshipCtrl.setCookie('name', cookieVal, 10);
					battleshipCtrl.loginUser();
				}
				else {
					view.displayError(xhttp.responseText);
					view.refreshPage();
				}
			}
		};
		xhttp.open('POST', requestPath + 'user?user_name=' + name +
			'&user_pw=' + pw, true);
		xhttp.send();
	},

	loginUser: function(name, pw) {
		// Sets an active user
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					battleshipCtrl.user = name;
					var loginCookie = battleshipCtrl.makeSecureVal(name);
					battleshipCtrl.setCookie('name', loginCookie, 10);
					view.showUserBanner();
					view.showHomeScreen();
				}
				else {
					view.displayError(xhttp.responseText);
					view.refreshPage();
				}
			}
		};
		xhttp.open('POST', requestPath + 'login?user_name=' + name +
			'&user_pw=' + pw, true);
		xhttp.send();
	},

	logoutUser: function() {
		// Clears the active user
		battleshipCtrl.clearCookie('name');
		battleshipCtrl.user = '';
		view.refreshPage();
	},

	getPlayerGames: function() {
		// Calls API to get all active player games, tells view to show them
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var gamesObj = JSON.parse(xhttp.responseText);
					battleshipCtrl.playerGamesList = gamesObj.games;
					view.showHomeScreenGamesList();
				}
				else if (xhttp.status === 404) {
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
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var gameKey = JSON.parse(xhttp.responseText).urlsafe_key;
					battleshipCtrl.setCookie('activeGame',
						gameKey, 10);
					battleshipCtrl.activeGame = gameKey;
					battleshipCtrl.gamePhase = 'placement';
					view.showPlaceShips(gameKey);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		var requestOjb = {"user_name": battleshipCtrl.user};
		xhttp.open('POST', requestPath + 'game', true);
		xhttp.setRequestHeader('Content-type', 'application/json');
		xhttp.send(JSON.stringify(requestOjb));
	},

	cancelGame: function(gameKey) {
		// Calls API to cancel a game based on given key
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
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
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var board = JSON.parse(xhttp.responseText).items
					if (boardType === 'ai_chart') {
						view.modifyPlayerBoard(board);
					}
					else {
						view.showBoard(board, boardType);
					}
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

	getShipStatuses: function(gameKey, fleet) {
		// Calls API and sends the view the ships' statuses
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					if (battleshipCtrl.gamePhase === 'placement') {
						var shipPlacements = JSON.parse(
							xhttp.responseText).condition.slice(5);
						for (var i = 0; i < shipPlacements.length; i++) {
							var items = shipPlacements[i].split(': ');
							battleshipCtrl.shipStatuses[items[0]] = items[1];
						}
						view.showShipPlacementStatus(shipPlacements);
						view.showDropDown();
					}
					else {
						var shipPlacements = JSON.parse(
							xhttp.responseText).condition.slice(0, 5);
						for (var i = 0; i < shipPlacements.length; i++) {
							var items = shipPlacements[i].split(': ');
							battleshipCtrl.shipStatuses[items[0]] = items[1];
						}
						view.showShipHealth(shipPlacements);
					}
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

	changeShipOrientation: function() {
		if (battleshipCtrl.placeShipOrientation === 'vertical') {
			battleshipCtrl.placeShipOrientation = 'horizontal';
			return 'row';
		}
		else {
			battleshipCtrl.placeShipOrientation = 'vertical';
			return 'column';
		}

	},

	placeShip: function(gameKey, boardX, boardY, orientation, ship) {
		// place a ship on the board
		var board = 'user_board';
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					view.refreshPage();
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		var requestOjb = {
			'bow_position': boardX,
			'bow_row': boardY,
			'orientation': orientation,
			'ship': ship
		};
		xhttp.open('POST', requestPath + 'game/' + gameKey +
			'/place_ship', true);
		xhttp.setRequestHeader('Content-type', 'application/json');
		xhttp.send(JSON.stringify(requestOjb));
	},

	resumeGame: function(gameKey) {
		// Checks the state of the game, and picks up where things left off
		battleshipCtrl.activeGame = gameKey;
		battleshipCtrl.setCookie('activeGame', gameKey, 10);

		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var shipPlacements = JSON.parse(
						xhttp.responseText).condition.slice(5);
					for (var i = 0; i < shipPlacements.length; i++) {
						if (shipPlacements[i].indexOf('Not placed') > -1) {
							battleshipCtrl.gamePhase = 'placement';
							view.showPlaceShips(gameKey);
							return null;
						}
					}
					battleshipCtrl.gamePhase = 'attack';
					battleshipCtrl.playGame(gameKey);
					var result = localStorage.getItem('result');
					if (result) {
						view.showTurnResult(result);
						localStorage.result = '';
					}
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
		battleshipCtrl.getBoard(gameKey, 'user_chart');
		battleshipCtrl.getBoard(gameKey, 'user_board');
		battleshipCtrl.getShipStatuses(gameKey, 'user_fleet');

	},

	makeMove: function(gameKey, boardX, boardY) {
		// fire a shot at the enemy
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					view.refreshPage();
					var result = JSON.parse(xhttp.responseText).message;
					localStorage.result = result;
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		var requestOjb = {
			'move_col': boardX,
			'move_row': boardY
		};
		xhttp.open('PUT', requestPath + 'game/' + gameKey, true);
		xhttp.setRequestHeader('Content-type', 'application/json');
		xhttp.send(JSON.stringify(requestOjb));
	},

	getScores: function() {
		// obtains all scores from API
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var scores = JSON.parse(xhttp.responseText).items;
					view.addScoresToView(scores, 'All scores');
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'scores', true);
		xhttp.send();
	},

	getTopScores: function() {
		// obtains top scores from API
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var scores = JSON.parse(xhttp.responseText).items;
					view.addScoresToView(scores, 'Top Scores');
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'top-scores', true);
		xhttp.send();
	},

	getUserScores: function() {
		// obtains user scores from API
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var scores = JSON.parse(xhttp.responseText).items;
					view.addScoresToView(scores, 'Your scores');
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'scores/user/' +
			battleshipCtrl.user, true);
		xhttp.send();
	},

	getRankings: function() {
		// obtains player rankings from API
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				if (xhttp.status === 200) {
					var rankings = JSON.parse(xhttp.responseText).items;
					view.addRankingsToView(rankings);
				}
				else {
					view.displayError(xhttp.responseText);
				}
			}
		};
		xhttp.open('GET', requestPath + 'rankings', true);
		xhttp.send();
	},
};

battleshipCtrl.init();