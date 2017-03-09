/**********
ToDos: 
1) Upon Game Over show mines
  -if you say something is a mine and it's not, you have to show a red x
2) use a ! and a ? for unsure (i.e. right-click events)
3) Stop defining styles within javascript and start using the addstyle and removestyle functions instead
5) Maybe allow people to choose how big a mine-field they want
6) The colors of the mines are all over the place
7) Make sure that code is efficient - i.e. just go through everything one last time
**********/


/****
Control the visual displays such as "Mines Left Display" and "Timer Display"
No logic here - just a way to modify these values in the DOM
****/
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

//Color for squares with a numerical value (i.e. they have adjacent mines)
function determineColor (realValue) {
		switch (realValue) {
			case 1:
				return "blue";
				break;
			case 2:
				return "green";
				break;
			case 3:
				return "red";
				break;
			case 4: 
				return "purple";
				break;
			case "-": 
				return "#e0e0e0";
				break;
			default:
				return "black";
		}	
}

//Allows us to add/remove classes for styling purposes
function replaceClass(cell, class1, class2) {
	if (cell.classList.contains(class1)) {
		cell.classList.remove(class1);
		cell.className += " " + class2;
	}
}



function board() {
	this.rows = 8;
	this.columns = 8;
	this.mines = 10;
	this.mineLocations = new Array(this.mines);
	this.hiddenBoard = [];
	this.totalSquares = this.rows * this.columns;
	this.table = document.getElementById("myTable");
}
board.prototype.initialize = function () {
	for (var i = 0; i < this.rows; i++) {
		var row = document.createElement("tr");
		this.hiddenBoard[i] = []; //start the creation of a two dimensional array

		for (var j = 0; j < this.columns; j++) {
			var cell = document.createElement("td");
			cell.id = (i + "-" + j);
			cell.className = "unpressed";
			cell.innerHTML = "&nbsp;";
	
			row.appendChild(cell);
			
			this.hiddenBoard[i][j] = "-"; //set all corresponding cells to blank
		}
		this.table.appendChild(row);
	}	
}
board.prototype.reInitialize = function () {
	for (var i = 0; i < this.rows; i++) {
		this.hiddenBoard[i] = []; //start the creation of a two dimensional array
		for (var j = 0; j < this.columns; j++) {
			var cell = document.getElementById(i + "-" + j);
			cell.innerHTML = "&nbsp;";
			cell.className = "unpressed";
			//cell.style.removeProperty("background");
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
		var cell = document.getElementById(mineId);
		cell.innerHTML = "*";
		replaceClass(cell, "unpressed","pressed");
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
	this.gameInSession = true; //using this mainly to stop timer race conditions
	this.timeElapsed = 0;
	this.timerStarted = false;
	this.myBoard = new board();
	this.myControls = new displayControls(this.myBoard.mines);
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

	document.getElementById('board').appendChild(this.myBoard.table);
	this.myControls.setMineDisplay(this.myBoard.mines);
}
game.prototype.startTimer = function () {
	this.timerStarted = true;
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
			} 
		}
	}
	if (won == true) this.youWin();
}
game.prototype.youWin =  function () { //stop timer and record winner name and time in table
	var winningTime = this.timeElapsed;
	this.timerStarted = false;
	clearInterval(this.timer);
	document.getElementById("face-display").style.backgroundImage = "url('happy.gif')";
	alert('your winning time is: ' + winningTime);
	
	var name = prompt("What is your name?", "N/A");
	var tdName = document.createElement("td");
	var tdTime = document.createElement("td");
	var trAppend = document.createElement("tr");
	var winnersTable = document.getElementById("winners-table");

	tdName.innerHTML = name;
	tdTime.innerHTML = winningTime;
	trAppend.appendChild(tdName);
	trAppend.appendChild(tdTime);
	winnersTable.appendChild(trAppend);
	winnersTable.classList.remove("hidden");
}
game.prototype.restart = function () {
	this.timerStarted = false
	clearInterval(this.timer);
	this.timeElapsed = 0;
	this.myControls.setTimeDisplay(this.timeElapsed);
	this.myBoard.reInitialize();
	this.myBoard.generateMines();
	this.myBoard.plantMines();
	this.myBoard.countAdjacentMines();
	this.myControls.setMineDisplay(this.myBoard.mines);
	this.gameInSession = true;
	document.getElementById("face-display").style.backgroundImage = "url('bored.gif')";
}
game.prototype.addClickEvents = function () {
	var that = this;
	//Specify what happens on both click and right click
	for (var i=0; i < this.myBoard.rows; i++) {
		for (var j=0; j< this.myBoard.columns; j++) {
			var cell = document.getElementById(i + "-" + j);
			
			//On Left Click
			cell.addEventListener("click", function (){
				if (that.gameInSession == true) {
					var cellValue = that.myBoard.hiddenBoard[(this.id[0])][(this.id[2])];
					if( cellValue == "*") that.gameOver(this); 
					else {
						if (that.timeElapsed == 0 && that.timerStarted == false) that.startTimer(); // start the timer if it hasn't been started yet
						if (this.innerHTML == "?") that.myControls.adjustMineDisplay(1); //If a "?", this means it's a suspected mine. Since you'll be removing the suspected mine by clicking on it, we should increment minesLeft count
						if ( cellValue == "-") that.recursiveLoop(this.id, that.myBoard);
						else {
							this.innerHTML = cellValue;
							replaceClass(this, "unpressed","pressed");
							this.style.color = determineColor(cellValue);
					} 
					//Check if you won the game
					that.checkIfWon(that.myBoard, that.myControls.returnMineDisplay());
					}
				}
			});
			
			//On Right Click
			cell.addEventListener("contextmenu", function(ev) {
				if (that.gameInSession == true) {
					ev.preventDefault();
					if (that.timeElapsed == 0 && that.timerStarted == false) that.startTimer(); // start the timer if it hasn't been started yet
					if (this.innerHTML != "?") {
						this.innerHTML = "?";
						this.className += " flagged";
						that.myControls.adjustMineDisplay(-1);
					} else {
						this.innerHTML = "&nbsp;";
						this.classList.remove("flagged");
						that.myControls.adjustMineDisplay(1);
					}
					//Now check if you won the game
					that.checkIfWon(that.myBoard, that.myControls.returnMineDisplay());
				}
			});
			cell.addEventListener("mousedown", function () {
				if (that.gameInSession == true) {
					document.getElementById("face-display").style.backgroundImage = "url('oh.gif')";
				}
			});
			window.addEventListener("mouseup", function() { //using window here since you might start the click on the cell and move over and let go on the side lol
				if (that.gameInSession == true) {
					document.getElementById("face-display").style.backgroundImage = "url('bored.gif')";
				}
			});
		}
	}
}
game.prototype.recursiveLoop = function(id, myBoard1) {
	var i = parseInt(id[0]);
	var j = parseInt(id[2]);
	var initialCell = document.getElementById(id);
	initialCell.innerHTML = "."; // function is only called on blank cells, so we know this is blank. we're putting this because in the event of an empty row, it won't collapse in height
	replaceClass(initialCell, "unpressed","pressed blank");

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
					replaceClass(cell, "unpressed","pressed");
					cell.style.color = determineColor(realValue);
					if (realValue == "-") this.recursiveLoop(val1 + "-" + val2,myBoard1);
				} 
			}	
			catch (err) {}
		}
	}	
}
game.prototype.gameOver = function(cell) {
	this.gameInSession = false;
	this.timerStarted = false;
	clearInterval(this.timer);
	cell.innerHTML = "*";
	replaceClass(cell, "unpressed","pressed");
	cell.style.color = "red";
	alert('You Lose :(');
	this.myBoard.showMines();
	document.getElementById("face-display").style.backgroundImage = "url('sad.gif')";
}



var myGame = new game();
myGame.initialize();
myGame.addClickEvents(); //add the left-click and right-click event listeners






