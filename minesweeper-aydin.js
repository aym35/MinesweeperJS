/**********
ToDos:
1) Upon Game Over, mark incorrectly flagged cells with a red x
2) Use a ! and a ? for unsure (i.e. right-click events)
3) Allow people to choose how big a mine-field they want
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
	};
	this.setMineDisplay = function(number) {
		mineDisplay.textContent = mineDisplayValue = number;
	};
	this.returnTimeDisplay = function() {
		return timeDisplayValue;
	};
	this.setTimeDisplay = function(number) {
		timeDisplay.textContent = timeDisplayValue = number;
	};
}
displayControls.prototype.adjustMineDisplay = function(number) {
	this.setMineDisplay(this.returnMineDisplay() + number);
};

function setFace(name) {
	document.getElementById("face-display").className = "face-" + name;
}


function board(rows, columns, mines) {
	this.rows = rows || 8;
	this.columns = columns || 8;
	this.mines = mines || 10;
	this.mineLocations = [];
	this.hiddenBoard = [];
	this.totalSquares = this.rows * this.columns;
	this.table = document.getElementById("myTable");
}
board.prototype.cellId = function(row, col) {
	return row + "-" + col;
};
board.prototype.parseId = function(id) {
	var parts = id.split("-");
	return { row: parseInt(parts[0], 10), col: parseInt(parts[1], 10) };
};
board.prototype.initialize = function() {
	for (var i = 0; i < this.rows; i++) {
		var row = document.createElement("tr");
		this.hiddenBoard[i] = [];

		for (var j = 0; j < this.columns; j++) {
			var cell = document.createElement("td");
			cell.id = this.cellId(i, j);
			cell.className = "unpressed";
			cell.innerHTML = "&nbsp;";

			row.appendChild(cell);

			this.hiddenBoard[i][j] = "-";
		}
		this.table.appendChild(row);
	}
};
board.prototype.reInitialize = function() {
	for (var i = 0; i < this.rows; i++) {
		this.hiddenBoard[i] = [];
		for (var j = 0; j < this.columns; j++) {
			var cell = document.getElementById(this.cellId(i, j));
			cell.innerHTML = "&nbsp;";
			cell.className = "unpressed";
			this.hiddenBoard[i][j] = "-";
		}
	}
};
board.prototype.generateMines = function() {
	this.mineLocations = [];
	while (this.mineLocations.length < this.mines) {
		var location = Math.floor(Math.random() * this.totalSquares);
		if (this.mineLocations.indexOf(location) === -1) {
			this.mineLocations.push(location);
		}
	}
};
board.prototype.showMines = function() {
	for (var i = 0; i < this.mines; i++) {
		var mineRow = Math.floor(this.mineLocations[i] / this.columns);
		var mineCol = this.mineLocations[i] % this.columns;
		var cell = document.getElementById(this.cellId(mineRow, mineCol));
		cell.textContent = "*";
		cell.classList.remove("unpressed");
		cell.classList.add("pressed");
	}
};
board.prototype.plantMines = function() {
	for (var i = 0; i < this.mines; i++) {
		var mineRow = Math.floor(this.mineLocations[i] / this.columns);
		var mineCol = this.mineLocations[i] % this.columns;
		this.hiddenBoard[mineRow][mineCol] = "*";
	}
};
board.prototype.countAdjacentMines = function() {
	for (var i = 0; i < this.rows; i++) {
		for (var j = 0; j < this.columns; j++) {
			if (this.hiddenBoard[i][j] === "*") continue;
			var counter = 0;
			for (var di = -1; di <= 1; di++) {
				for (var dj = -1; dj <= 1; dj++) {
					if (di === 0 && dj === 0) continue;
					var ni = i + di;
					var nj = j + dj;
					if (ni < 0 || ni >= this.rows || nj < 0 || nj >= this.columns) continue;
					if (this.hiddenBoard[ni][nj] === "*") counter++;
				}
			}
			if (counter !== 0) this.hiddenBoard[i][j] = counter;
		}
	}
};

board.prototype.showCells = function() {
	for (var i = 0; i < this.rows; i++) {
		for (var j = 0; j < this.columns; j++) {
			if (this.hiddenBoard[i][j] !== "-") {
				var element = document.getElementById(this.cellId(i, j));
				element.textContent = this.hiddenBoard[i][j];
				element.classList.add("revealed");
			}
		}
	}
};

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
	};
}
game.prototype.initialize = function() {
	this.myBoard.initialize();
	this.myBoard.generateMines();
	this.myBoard.plantMines();
	this.myBoard.countAdjacentMines();

	document.getElementById("board").appendChild(this.myBoard.table);
	this.myControls.setMineDisplay(this.myBoard.mines);
};
game.prototype.startTimer = function() {
	this.timerStarted = true;
	this.timer = setInterval(this.incrementTimer, 1000);
};
game.prototype.checkIfWon = function(varBoard, varMine) {
	if (varMine !== 0) return;
	for (var i = 0; i < varBoard.rows; i++) {
		for (var j = 0; j < varBoard.columns; j++) {
			var cell = document.getElementById(varBoard.cellId(i, j));
			if (cell.classList.contains("unpressed") && !cell.classList.contains("flagged")) {
				return;
			}
		}
	}
	this.youWin();
};
game.prototype.youWin = function() { //stop timer and record winner name and time in table
	var winningTime = this.timeElapsed;
	this.timerStarted = false;
	clearInterval(this.timer);
	setFace("happy");
	alert("your winning time is: " + winningTime);

	var name = prompt("What is your name?", "N/A");
	var tdName = document.createElement("td");
	var tdTime = document.createElement("td");
	var trAppend = document.createElement("tr");
	var winnersTable = document.getElementById("winners-table");

	tdName.textContent = name;
	tdTime.textContent = winningTime;
	trAppend.appendChild(tdName);
	trAppend.appendChild(tdTime);
	winnersTable.appendChild(trAppend);
	winnersTable.classList.remove("hidden");
};
game.prototype.restart = function() {
	this.timerStarted = false;
	clearInterval(this.timer);
	this.timeElapsed = 0;
	this.myControls.setTimeDisplay(this.timeElapsed);
	this.myBoard.reInitialize();
	this.myBoard.generateMines();
	this.myBoard.plantMines();
	this.myBoard.countAdjacentMines();
	this.myControls.setMineDisplay(this.myBoard.mines);
	this.gameInSession = true;
	setFace("bored");
};
game.prototype.revealCell = function(cell, value) {
	cell.textContent = value;
	cell.classList.remove("unpressed");
	cell.classList.add("pressed");
	cell.classList.add("n" + value);
};
game.prototype.floodReveal = function(startId) {
	var board = this.myBoard;
	var stack = [startId];
	while (stack.length) {
		var curId = stack.pop();
		var initial = document.getElementById(curId);
		if (!initial.classList.contains("unpressed") || initial.classList.contains("flagged")) {
			continue;
		}
		var pos = board.parseId(curId);
		initial.textContent = ".";
		initial.classList.remove("unpressed");
		initial.classList.add("pressed", "blank");

		for (var di = -1; di <= 1; di++) {
			for (var dj = -1; dj <= 1; dj++) {
				if (di === 0 && dj === 0) continue;
				var ni = pos.row + di;
				var nj = pos.col + dj;
				if (ni < 0 || ni >= board.rows || nj < 0 || nj >= board.columns) continue;
				var realValue = board.hiddenBoard[ni][nj];
				if (realValue === "*") continue;
				var cell = document.getElementById(board.cellId(ni, nj));
				if (!cell.classList.contains("unpressed") || cell.classList.contains("flagged")) continue;
				if (realValue === "-") {
					stack.push(board.cellId(ni, nj));
				} else {
					this.revealCell(cell, realValue);
				}
			}
		}
	}
};
game.prototype.addClickEvents = function() {
	var that = this;
	for (var i = 0; i < this.myBoard.rows; i++) {
		for (var j = 0; j < this.myBoard.columns; j++) {
			var cell = document.getElementById(this.myBoard.cellId(i, j));

			//On Left Click
			cell.addEventListener("click", function() {
				if (!that.gameInSession) return;
				var pos = that.myBoard.parseId(this.id);
				var cellValue = that.myBoard.hiddenBoard[pos.row][pos.col];
				if (cellValue === "*") {
					that.gameOver(this);
					return;
				}
				if (that.timeElapsed === 0 && !that.timerStarted) that.startTimer();
				if (this.classList.contains("flagged")) {
					this.classList.remove("flagged");
					this.innerHTML = "&nbsp;";
					that.myControls.adjustMineDisplay(1);
				}
				if (cellValue === "-") {
					that.floodReveal(this.id);
				} else {
					that.revealCell(this, cellValue);
				}
				that.checkIfWon(that.myBoard, that.myControls.returnMineDisplay());
			});

			//On Right Click
			cell.addEventListener("contextmenu", function(ev) {
				if (!that.gameInSession) return;
				ev.preventDefault();
				if (!this.classList.contains("unpressed")) return;
				if (that.timeElapsed === 0 && !that.timerStarted) that.startTimer();
				if (!this.classList.contains("flagged")) {
					this.innerHTML = "?";
					this.classList.add("flagged");
					that.myControls.adjustMineDisplay(-1);
				} else {
					this.innerHTML = "&nbsp;";
					this.classList.remove("flagged");
					that.myControls.adjustMineDisplay(1);
				}
				that.checkIfWon(that.myBoard, that.myControls.returnMineDisplay());
			});
		}
	}

	//Single delegated mousedown on the table, single mouseup on the window
	this.myBoard.table.addEventListener("mousedown", function(ev) {
		if (that.gameInSession && ev.target.tagName === "TD") {
			setFace("oh");
		}
	});
	window.addEventListener("mouseup", function() {
		if (that.gameInSession) {
			setFace("bored");
		}
	});

	//Restart button (was an inline onclick in HTML)
	document.getElementById("face-display").addEventListener("click", function() {
		that.restart();
	});
};
game.prototype.gameOver = function(cell) {
	this.gameInSession = false;
	this.timerStarted = false;
	clearInterval(this.timer);
	cell.textContent = "*";
	cell.classList.remove("unpressed");
	cell.classList.add("pressed", "exploded");
	alert("You Lose :(");
	this.myBoard.showMines();
	setFace("sad");
};



var myGame = new game();
myGame.initialize();
myGame.addClickEvents(); //add the left-click and right-click event listeners
