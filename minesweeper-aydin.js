/**********
ToDos: 
1) make sure colors are defined at top
1.5) when instantiating displayControls, are we forgetting to pass in numberOfMines and does it matter
2) still a bug if one full column or row of " " cell innerHTML values
3) maybe change cells into buttons
**********/

var table = document.createElement("table");
table.id = "myTable";

function displayControls(numberOfMines) {
	var mineDisplayValue = numberOfMines;
	var timeDisplayValue = 0;
	var mineDisplay = document.getElementById("mines-left");
	var timeDisplay = document.getElementById("time-elapsed");

	this.returnMineDisplay = function() {
		return mineDisplayValue;
	}
	this.setMineDisplay = function(number) {
		mineDisplay.innerHTML = mineDisplayValue = number;
	}
	this.returnTimeDisplay = function() {
		return timeDisplayValue;
	}
	this.setTimeDisplay = function(number) {
		timeDisplay.innerHTML = timeDisplayValue = number;
	}
}
displayControls.prototype.adjustMineDisplay= function(number) {
	this.setMineDisplay((this.returnMineDisplay() + number));
}



function board() {
	this.rows = 8;
	this.columns = 8;
	this.mines = 10;
	this.mineLocations = new Array(this.mines);
	this.hiddenBoard = [];
	this.totalSquares = this.rows * this.columns;
}
board.prototype.initialize = function () {
	for (var i = 0; i < this.rows; i++) {
		var row = document.createElement("tr");
		this.hiddenBoard[i] = []; //start the creation of a two dimensional array

		for (var j = 0; j < this.columns; j++) {
			var cell = document.createElement("td");
			cell.id = (i + "-" + j);

			cell.innerHTML = "&nbsp;";
	
			row.appendChild(cell);
			
			this.hiddenBoard[i][j] = "-"; //set all corresponding cells to blank
		}
		table.appendChild(row);
	}	
}
board.prototype.reInitialize = function () {
	for (var i = 0; i < this.rows; i++) {
		this.hiddenBoard[i] = []; //start the creation of a two dimensional array
		for (var j = 0; j < this.columns; j++) {
			var cell = document.getElementById(i + "-" + j);
			cell.innerHTML = "&nbsp;";
			cell.style.removeProperty("background");
			this.hiddenBoard[i][j] = "-"; //set all corresponding cells to blank
		}
	}	
}
board.prototype.generateMines = function () {
	for (var i = 0; i < this.mines; i++) {
		var location = Math.floor(Math.random() * this.totalSquares);
		//Make sure no duplicates
		while (this.mineLocations.indexOf(location) != -1) {
			location = Math.floor(Math.random() * this.totalSquares);
		}
		this.mineLocations[i] = location;
	}
}
board.prototype.showMines = function() {
	for (var i = 0; i < this.mines; i++) {
		var mineColumn = this.mineLocations[i] % this.rows
		var mineRow = (this.mineLocations[i] - mineColumn) / (this.columns);
		var mineId = "" + (mineRow) + "-" + (mineColumn);
		document.getElementById(mineId).innerHTML = "*";

	}
}
board.prototype.plantMines = function() {
	for (var i = 0; i < this.mines; i++) {
		var mineColumn = this.mineLocations[i] % this.rows
		var mineRow = (this.mineLocations[i] - mineColumn) / (this.columns);
		this.hiddenBoard[mineRow][mineColumn] = "*";
	}
}
board.prototype.countAdjacentMines = function() { //Count number of adjacent mines and record value
	for (var i = 0; i < (this.rows); i++) {
		for (var j = 0; j < (this.columns); j++) {
			if(this.hiddenBoard[i][j] != "*") {
				var counter = 0; 
				try {	if (this.hiddenBoard[(i-1)][(j-1)] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[(i-1)][j] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[(i-1)][(j+1)] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[i][(j-1)] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[i][(j+1)] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[(i+1)][(j-1)] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[(i+1)][j] == "*") counter += 1; } catch (e) {}
				try { if (this.hiddenBoard[(i+1)][(j+1)] == "*") counter += 1; } catch (e) {}
				if (counter != 0)	this.hiddenBoard[i][j] = counter;			
			}
		}
	}
}

board.prototype.showCells = function () {
	for (var i = 0; i < this.rows; i++) {
		for (var j = 0; j < this.columns; j++) {
			if (this.hiddenBoard[i][j] != "-") {
				var element = document.getElementById(i + "-" + j);
				element.innerHTML = this.hiddenBoard[i][j];	
				element.style.background="lightblue";
			}
			
		}
	}
}

function game() {
	this.timeElapsed = 0;
	this.myBoard = new board();
	this.myControls = new displayControls();
	var that = this;	
	this.incrementTimer = function() {
		that.timeElapsed += 1;
		that.myControls.setTimeDisplay(that.timeElapsed);
	}
}
game.prototype.initialize = function () {
	this.myBoard.initialize();
	this.myBoard.generateMines();
	this.myBoard.plantMines();
	this.myBoard.countAdjacentMines();

	document.getElementById('board').appendChild(table);
	this.myControls.setMineDisplay(this.myBoard.mines);
}
game.prototype.incrementTimer = function () {
	this.timeElapsed += 1;
	timeDisplay.innerHTML = this.timeElapsed;
}
game.prototype.startTimer = function () {
	this.timer = setInterval(this.incrementTimer,1000);
}
game.prototype.checkIfWon = function (varBoard, varMine) {
	var won = true;
	loop1:
	for (var i = 0; i < varBoard.rows; i++) {
		loop2:
		for (var j = 0; j < varBoard.columns; j++) {
			var shownValue = document.getElementById(i + "-" + j).innerHTML;
			if (shownValue == "*" || shownValue == "&nbsp;" || varMine != 0){
				won = false;
				//break;
			} 
		}
	}
	if (won == true) this.youWin();
}
game.prototype.youWin =  function () { //stop timer and record winner name and time in table
	var winningTime = this.timeElapsed;
	clearInterval(this.timer);
	alert('your winning time is: ' + winningTime);
	var name = prompt("What is your name?", "N/A");
	var tdName = document.createElement("td");
	tdName.innerHTML = name;
	var tdTime = document.createElement("td");
	tdTime.innerHTML = winningTime;
	var trAppend = document.createElement("tr");
	trAppend.appendChild(tdName);
	trAppend.appendChild(tdTime);
	var winnersTable = document.getElementById("winners-table")
	winnersTable.appendChild(trAppend);
	winnersTable.classList.remove("hidden");
}
game.prototype.restart = function () {
	clearInterval(this.timer);
	this.timeElapsed = 0;
	this.myBoard.reInitialize();
	this.myBoard.generateMines();
	this.myBoard.plantMines();
	this.myBoard.countAdjacentMines();
	this.myControls.setMineDisplay(this.myBoard.mines);
	this.startTimer();
}
game.prototype.addClickEvents = function () {
	var that = this;
	//Specify what happens on both click and right click
	for (var i=0; i < this.myBoard.rows; i++) {
		for (var j=0; j< this.myBoard.columns; j++) {
			var cell = document.getElementById(i + "-" + j);
			
			//On Left Click
			cell.addEventListener("click", function (){
				if (that.timeElapsed == 0) that.startTimer(); // start the timer if it hasn't been started yet
				if (this.innerHTML == "?") updateMineValue(1); //If a "?", this means it's a suspected mine. Since you'll be removing the suspected mine by clicking on it, we should increment the minesLeft count
				var cellValue = that.myBoard.hiddenBoard[(this.id[0])][(this.id[2])];
				if( cellValue == "*") alert('game over');
				else if ( cellValue == "-") that.recursiveLoop(this.id, that.myBoard);
				else {
					this.innerHTML = cellValue; 
					this.style.background = "#e0e0e0";
					this.style.color = that.determineColor(cellValue);
				} 
				//Check if you won the game
				that.checkIfWon(that.myBoard, that.myControls.returnMineDisplay());
			});
			
			//On Right Click
			cell.addEventListener("contextmenu", function(ev) {
				ev.preventDefault();
				if (that.timeElapsed == 0) that.startTimer(); // start the timer if it hasn't been started yet
				if (this.innerHTML != "?") {
					this.innerHTML = "?";
					this.style.background = '#ff2b47';
					that.myControls.adjustMineDisplay(-1);
				} else {
					this.innerHTML = "&nbsp;";
					this.style.removeProperty("background");
					that.myControls.adjustMineDisplay(1);
				}
				//Now check if you won the game
				that.checkIfWon(that.myBoard, that.myControls.returnMineDisplay());
			});
		}
	}
}
game.prototype.recursiveLoop = function(id, myBoard1) {
	var i = parseInt(id[0]);
	var j = parseInt(id[2]);
	var initialCell = document.getElementById(id);
	initialCell.innerHTML = " "; // function is only called on blank cells, so we know this is blank
	initialCell.style.background = "#e0e0e0";

	var manipulators = [0,-1,1];
	for (var a in manipulators) {
		for (var b in manipulators) {
			try {
				var val1 = i + parseInt(manipulators[a]); 
				var val2 = j + parseInt(manipulators[b]);
				var realValue = myBoard1.hiddenBoard[val1][val2];
				var cell = document.getElementById(val1 + "-" + val2);
				
				if ( realValue != "*" && cell.innerHTML == "&nbsp;") {
					cell.innerHTML = realValue;
					cell.style.background = "#e0e0e0";
					cell.style.color = this.determineColor(realValue);
					if (realValue == "-") this.recursiveLoop(val1 + "-" + val2,myBoard1);
				} 
			}	
			catch (err) {}
		}
	}	
}
game.prototype.determineColor = function(realValue) {
	switch (realValue) {
		case 1:
			return "blue";
			break;
		case 2:
			return "green";
			break;
		case 3:
			return "red";
		case 4: 
			return "purple";
		default:
			return "black";
	}
}



var myGame = new game();
myGame.initialize();
myGame.addClickEvents(); //add the left-click and right-click event listeners






