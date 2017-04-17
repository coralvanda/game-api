'use strict';

var containerDiv 		= document.getElementById('container');
var welcomeDiv 			= document.createElement('DIV');
welcomeDiv.id 			= 'welcome-div';
var loginDiv 			= document.createElement('DIV');
loginDiv.id 			= 'login-div';
var usernameDiv 		= document.createElement('DIV');
usernameDiv.id 			= 'username-div';
var homescreenDiv 		= document.createElement('DIV');
homescreenDiv.id 		= 'homescreen-div';
var placeShipsDiv 		= document.createElement('DIV');
placeShipsDiv.id 		= 'place-ships-div';
var placeShipsUpper 	= document.createElement('DIV');
placeShipsUpper.id 		= 'place-ships-upper';
var placeShipsLower 	= document.createElement('DIV');
placeShipsLower.id 		= 'place-ships-lower';
var shipPlacementsDiv 	= document.createElement('DIV');
shipPlacementsDiv.id 	= 'ship-placements-div';
var shipsDropdownDiv 	= document.createElement('DIV');
shipsDropdownDiv.id 	= 'ship-dropdown';
var gameBoardsDiv 		= document.createElement('DIV');
gameBoardsDiv.id 		= 'game-boards';
var ship 				= null;
var selectedShip 		= null;
var shipList 			= [
							'Carrier',
							'Battleship',
							'Cruiser',
							'Submarine',
							'Destroyer'
						];
var shipLengths 		= {
							'destroyer': 2,
							'battleship': 4,
							'carrier': 5,
							'cruiser': 3,
							'submarine': 3
						};


var view = {

	displayError: function(error) {
		// Displays an alert window containing an error
		if (error) {
			alert(error);
		}
	},

	refreshPage: function() {
		// Refreshes the page
		location.reload();
	},

	showWelcome: function() {
		containerDiv.appendChild(welcomeDiv);
		var welcomeText = document.createTextNode('Welcome to Battleship! ');
		welcomeDiv.appendChild(welcomeText);
		var loginOrRegisterText = document.createTextNode('Login or register.');
		welcomeDiv.appendChild(loginOrRegisterText);

		var showLoginBtn = document.createElement('DIV');
		showLoginBtn.className = 'button';
		showLoginBtn.onclick = function() {
			welcomeDiv.parentElement.removeChild(welcomeDiv);
			view.showLogin();
		};
		var showLoginBtnText = document.createTextNode('Login');
		showLoginBtn.appendChild(showLoginBtnText);
		welcomeDiv.appendChild(showLoginBtn);

		var showRegisterBtn = document.createElement('DIV');
		showRegisterBtn.className = 'button';
		showRegisterBtn.onclick = function() {
			welcomeDiv.parentElement.removeChild(welcomeDiv);
			view.showRegister();
		}
		var showRegisterBtnText = document.createTextNode('Register');
		showRegisterBtn.appendChild(showRegisterBtnText);
		welcomeDiv.appendChild(showRegisterBtn);
	},

	showRegister: function() {
		// Display a text input field and buttons to either log in
		// or register a new user
		containerDiv.appendChild(loginDiv);
		var validName 		= false;
		var validPW 		= false;
		var validPWConfirm 	= false;
		var validEmail 		= false;

		// Text fields
		var userNameInput = document.createElement('INPUT');
		userNameInput.type = 'text';
		userNameInput.id = 'username-input';
		userNameInput.placeholder = 'Enter user name';
		userNameInput.addEventListener('keyup', function() {
			if (battleshipCtrl.validUsername(userNameInput.value)) {
				validName = true;
				usernameLight.className = 'green-light';
			}
			else {
				validName = false;
				usernameLight.className = 'red-light';
			}
		});
		loginDiv.appendChild(userNameInput);

		var usernameLight = document.createElement('DIV');
		usernameLight.className = 'red-light';
		loginDiv.appendChild(usernameLight);

		var passwordInput = document.createElement('INPUT');
		passwordInput.type = 'password';
		passwordInput.id = 'password-input';
		passwordInput.placeholder = 'Enter your password';
		passwordInput.addEventListener('keyup', function() {
			if (battleshipCtrl.validPassword(passwordInput.value)) {
				validPW = true;
				passwordLight.className = 'green-light';
			}
			else {
				validPW = false;
				passwordLight.className = 'red-light';
			}
		});
		loginDiv.appendChild(passwordInput);

		var passwordLight = document.createElement('DIV');
		passwordLight.className = 'red-light';
		loginDiv.appendChild(passwordLight);

		var confirmPassword = document.createElement('INPUT');
		confirmPassword.type = 'password';
		confirmPassword.id = 'confirm-password';
		confirmPassword.placeholder = 'Confirm your password';
		confirmPassword.addEventListener('keyup', function() {
			if (battleshipCtrl.validPassword(confirmPassword.value) &&
				(confirmPassword.value === passwordInput.value)) {
				validPWConfirm = true;
				confirmPWLight.className = 'green-light';
			}
			else {
				validPWConfirm = false;
				confirmPWLight.className = 'red-light';
			}
		});
		loginDiv.appendChild(confirmPassword);

		var confirmPWLight = document.createElement('DIV');
		confirmPWLight.className = 'red-light';
		loginDiv.appendChild(confirmPWLight);

		var emailInput = document.createElement('INPUT');
		emailInput.type = 'text';
		emailInput.id = 'email-input';
		emailInput.placeholder = 'Enter your email (optional)';
		emailInput.addEventListener('keyup', function() {
			if (battleshipCtrl.validEmail(emailInput.value)) {
				validEmail = true;
				emailLight.className = 'green-light';
			}
			else {
				validEmail = false;
				emailLight.className = 'red-light';
			}
		});
		loginDiv.appendChild(emailInput);

		var emailLight = document.createElement('DIV');
		emailLight.className = 'red-light';
		loginDiv.appendChild(emailLight);

		// Register button
		var registerSubmitBtn = document.createElement('DIV');
		registerSubmitBtn.className = 'button';
		registerSubmitBtn.onclick = function() {
			if (validName && validPW && validPWConfirm) {
				battleshipCtrl.registerUser(userNameInput.value,
					passwordInput.value);
				loginDiv.parentElement.removeChild(loginDiv);
			}
			else {
				alert('Please ensure that name and password fields are green');
			}
		}
		var registerSubmitBtnText = document.createTextNode('Register');
		registerSubmitBtn.appendChild(registerSubmitBtnText);
		loginDiv.appendChild(registerSubmitBtn);
	},

	showLogin: function() {
		// Display a text input field and buttons to either log in
		// or register a new user
		var validLoginName 		= false;
		var validLoginPW 		= false;
		containerDiv.appendChild(loginDiv);

		// Text fields
		var loginUserNameInput = document.createElement('INPUT');
		loginUserNameInput.type = 'text';
		loginUserNameInput.id = 'login-username-input';
		loginUserNameInput.placeholder = 'Enter user name';
		loginUserNameInput.addEventListener('keyup', function() {
			if (battleshipCtrl.validUsername(loginUserNameInput.value)) {
				validLoginName = true;
				loginUsernameLight.className = 'green-light';
			}
			else {
				validLoginName = false;
				loginUsernameLight.className = 'red-light';
			}
		});
		loginDiv.appendChild(loginUserNameInput);

		var loginUsernameLight = document.createElement('DIV');
		loginUsernameLight.className = 'red-light';
		loginDiv.appendChild(loginUsernameLight);

		var loginPasswordInput = document.createElement('INPUT');
		loginPasswordInput.type = 'password';
		loginPasswordInput.id = 'login-password-input';
		loginPasswordInput.placeholder = 'Enter your password';
		loginPasswordInput.addEventListener('keyup', function() {
			if (battleshipCtrl.validPassword(loginPasswordInput.value)) {
				validLoginPW = true;
				loginPasswordLight.className = 'green-light';
			}
			else {
				validLoginPW = false;
				loginPasswordLight.className = 'red-light';
			}
		});
		loginDiv.appendChild(loginPasswordInput);

		var loginPasswordLight = document.createElement('DIV');
		loginPasswordLight.className = 'red-light';
		loginDiv.appendChild(loginPasswordLight);

		// Login
		var loginSubmitBtn = document.createElement('DIV');
		loginSubmitBtn.className = 'button';
		loginSubmitBtn.onclick = function() {
			battleshipCtrl.loginUser(loginUserNameInput.value,
				loginPasswordInput.value);
			loginDiv.parentElement.removeChild(loginDiv);
		};
		var loginSubmitBtnText = document.createTextNode('Login');
		loginSubmitBtn.appendChild(loginSubmitBtnText);
		loginDiv.appendChild(loginSubmitBtn);
	},

	showUserBanner: function() {
		// Displays the active user at the top of the screen
		containerDiv.appendChild(usernameDiv);

		var usernameHeader = document.createElement('H3');
		usernameHeader.id = 'username-header';
		var usernameHeaderText = document.createTextNode(
			'Playing as user: ' + battleshipCtrl.user);
		usernameHeader.appendChild(usernameHeaderText);
		usernameDiv.appendChild(usernameHeader);

		var homeBtn = document.createElement('DIV');
		var homeBtnText = document.createTextNode('Home');
		homeBtn.className = 'button';
		homeBtn.id = 'home-btn';
		homeBtn.onclick = function() {
			battleshipCtrl.clearCookie('activeGame');
			view.refreshPage();
			battleshipCtrl.homeScreen();
		}
		homeBtn.appendChild(homeBtnText);
		usernameDiv.appendChild(homeBtn);

		var logoutBtn = document.createElement('DIV');
		var logoutBtnText = document.createTextNode('Logout');
		logoutBtn.className = 'button';
		logoutBtn.id = 'logout-btn';
		logoutBtn.onclick = function() {
			battleshipCtrl.logoutUser();
		}
		logoutBtn.appendChild(logoutBtnText);
		usernameDiv.appendChild(logoutBtn);
	},

	showHomeScreen: function() {
		// Displays the user's home screen

		// each open game listed should have a button to allow the user
		// to cancel (delete) that game, with a confirmation alert
		containerDiv.appendChild(homescreenDiv);

		var newGameBtn = document.createElement('DIV');
		newGameBtn.className = 'button';
		newGameBtn.onclick = function() {
			battleshipCtrl.newGame();
			homescreenDiv.parentElement.removeChild(homescreenDiv);
		};

		var newGameBtnText = document.createTextNode('New Game');
		newGameBtn.appendChild(newGameBtnText);
		homescreenDiv.appendChild(newGameBtn);

		battleshipCtrl.getPlayerGames();
	},

	showHomeScreenGamesList: function(optionalText=false) {
		// Displays the list of actives games for the user
		var gamesListTitle = document.createElement('H3');
		var gamesListTitleText = document.createTextNode('Active Games');
		gamesListTitle.appendChild(gamesListTitleText);
		homescreenDiv.appendChild(gamesListTitle);

		var openGamesList = document.createElement('OL');
		if (optionalText) {
			var noGameFoundItem = document.createElement('LI');
			var noGameFoundItemText = document.createTextNode(optionalText);
			noGameFoundItem.appendChild(noGameFoundItemText);
			openGamesList.appendChild(noGameFoundItem);
		}
		else {
			var games = battleshipCtrl.playerGamesList;
			for (var i = 0; i < games.length; i++) {
				var gameListItem = document.createElement('LI');
				gameListItem.className = 'game-list-item';
				openGamesList.appendChild(gameListItem);

				var resumeGameBtn = document.createElement('DIV');
				resumeGameBtn.className = 'resume-game button';
				var resumeGameBtnText = document.createTextNode('Resume');
				resumeGameBtn.addEventListener('click', (function(keyCopy) {
					return function() {
						homescreenDiv.parentElement.removeChild(homescreenDiv);
						battleshipCtrl.resumeGame(keyCopy);
					};
				})(games[i].urlsafe_key));
				resumeGameBtn.appendChild(resumeGameBtnText);
				gameListItem.appendChild(resumeGameBtn);

				var cancelGameBtn = document.createElement('DIV');
				cancelGameBtn.className = 'cancel-game button';
				var cancelGameBtnText = document.createTextNode('Cancel');
				cancelGameBtn.addEventListener('click', (function(keyCopy) {
					return function() {
						var confirmation = confirm('Delete game?');
						if (confirmation) {
							battleshipCtrl.cancelGame(keyCopy);
						}
					};
				})(games[i].urlsafe_key));
				cancelGameBtn.appendChild(cancelGameBtnText);
				gameListItem.appendChild(cancelGameBtn);
			}
		}
		homescreenDiv.appendChild(openGamesList);
	},

	showPlaceShips: function(gameKey) {
		// Displays the user's board and available ships which must be placed
		containerDiv.appendChild(placeShipsDiv);
		placeShipsDiv.appendChild(placeShipsUpper);
		placeShipsDiv.appendChild(placeShipsLower);
		battleshipCtrl.getBoard(gameKey, 'user_board');
		battleshipCtrl.getShipPlacementStatus(gameKey, 'user_fleet');
	},

	showDropDown: function() {
		var shipsDropdown = document.createElement('SELECT');

		var dropdownDefault = document.createElement('OPTION');
		dropdownDefault.selected = 'selected';
		dropdownDefault.innerHTML = 'Select a ship';
		shipsDropdown.appendChild(dropdownDefault);

		for (var i = 0; i < shipList.length; i++) {
			if (battleshipCtrl.shipStatuses[shipList[i]] === 'Not placed') {
				var option = document.createElement('OPTION');
				option.value = shipList[i].toLowerCase();
				option.innerHTML = shipList[i];
				shipsDropdown.appendChild(option);
			}
		}
		shipsDropdownDiv.appendChild(shipsDropdown);
		placeShipsLower.appendChild(shipsDropdownDiv);

		var changeOrientationDiv = document.createElement('DIV');
		changeOrientationDiv.id = 'orientation-div';
		var changeorientationP = document.createElement('P');
		changeorientationP.innerHTML = 'Change orientation';
		var changeOrientationBtn = document.createElement('DIV');
		changeOrientationBtn.innerHTML = '&#10150;'
		changeOrientationBtn.id = 'orientation-btn';
		changeOrientationDiv.appendChild(changeorientationP);
		changeOrientationDiv.appendChild(changeOrientationBtn);
		placeShipsLower.appendChild(changeOrientationDiv);

		changeOrientationBtn.addEventListener('click', function() {
			var orientation = battleshipCtrl.changeShipOrientation();
			if (ship) {
				ship.style.flexDirection = orientation;
			}
		});

		shipsDropdown.addEventListener('change', function() {
			if (ship) {
				ship.outerHTML = '';
				ship = null;
			}
			selectedShip = shipsDropdown.options[
				shipsDropdown.selectedIndex].value;
			if (selectedShip === 'Select a ship') {
				selectedShip = null;
				return null;
			}
			ship = document.createElement('DIV');
			ship.className = 'ship';
			ship.id = selectedShip;

			var selectedShipCap = selectedShip[0].toUpperCase() + selectedShip.slice(1);
			if (battleshipCtrl.shipStatuses[selectedShipCap] === 'Not placed') {
				for (var s = 0; s < shipLengths[selectedShip]; s++) {
					var hullSection = document.createElement('DIV');
					hullSection.className = 'hull-section';
					ship.appendChild(hullSection);
				}
				placeShipsLower.appendChild(ship);
				// create visualization for ship placement on board
				// break out of function
				return null;
			}
		});
		alert('Select ships, then click on the board position where ' +
			'you want to place the bow of the ship.');
	},

	showBoard: function(board, boardType) {
		// Displays the given board or chart

		// must have a way to distinguish charts from boards
		// and clearly show the user which is which

		var boardDiv = document.createElement('DIV');
		boardDiv.id = 'board-div';
		var gameBoard = document.createElement('DIV');
		gameBoard.className = 'board';
		for (var row = 0; row < board.length; row++) {
			var rowDiv = document.createElement('DIV');
			rowDiv.className = 'row-div';
			for (var col = 3; col < board[row].length; col++) {
				var colDiv = document.createElement('DIV');
				colDiv.className = 'col-div';
				if (board[row][col] === '0') {
					colDiv.className += ' blue';
				}
				else {
					colDiv.className += ' red';
				}
				var coordinates = row + '-' + (col - 3)
				colDiv.id = coordinates;
				colDiv.addEventListener('mouseup', (function(coordsCopy) {
					return function() {
						if (selectedShip) {
							var key = battleshipCtrl.getCookie('activeGame');
							var ship = selectedShip;
							battleshipCtrl.placeShip(key,
								coordsCopy[2],
								coordsCopy[0],
								battleshipCtrl.placeShipOrientation,
								ship);
						}
						// else if board is chart and user is attacking
					};
				})(coordinates));
				rowDiv.appendChild(colDiv);
			}
			gameBoard.appendChild(rowDiv);
		}
		boardDiv.appendChild(gameBoard);
		if (battleshipCtrl.gamePhase === 'placement') {
			gameBoard.id = 'placement-board';
			placeShipsUpper.insertBefore(boardDiv, shipPlacementsDiv);
		}
		else {
			var boardTitle = document.createElement('DIV');
			boardTitle.className = 'board-title';
			if (boardType === 'user_chart') {
				gameBoard.id = 'chart';
				var titleText = document.createTextNode('Chart your hits ' +
					'and misses.');
			}
			else {
				gameBoard.id = 'board';
				var titleText = document.createTextNode('Keep track of ' +
					'the condition of your fleet.');
			}
			boardTitle.append(titleText);
			boardDiv.insertBefore(boardTitle, gameBoard);
			gameBoardsDiv.appendChild(boardDiv);
			containerDiv.appendChild(gameBoardsDiv);
		}
	},

	showShipPlacementStatus: function(ships) {
		// Displays current placement status for all user ships
		for (var i = 0; i < ships.length; i++) {
			var placementsDiv = document.createElement('DIV');
			var placementText = document.createTextNode(ships[i]);
			if (ships[i].indexOf('Not') === -1) {
				placementsDiv.className = 'placed';
			}
			placementsDiv.append(placementText);
			shipPlacementsDiv.appendChild(placementsDiv);
		}
		placeShipsUpper.append(shipPlacementsDiv);
	},
};