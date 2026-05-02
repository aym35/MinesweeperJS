import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const html = fs.readFileSync(path.join(root, 'minesweeper.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'minesweeper-aydin.js'), 'utf8');

/**
 * Loads the app into a fresh JSDOM window.
 * Returns helpers for poking at the running game.
 *
 *   const ctx = loadGame();
 *   ctx.click(0, 0);                     // left-click cell 0,0
 *   ctx.rightClick(2, 3);                // right-click cell 2,3
 *   ctx.cell(0, 0).classList.contains('pressed');
 *   ctx.dispose();                       // tear down jsdom (clears timers)
 */
export function loadGame({ randomValues } = {}) {
	const dom = new JSDOM(html, {
		runScripts: 'outside-only',
		url: 'http://localhost/',
		pretendToBeVisual: true,
	});
	const { window } = dom;

	const alertCalls = [];
	const promptCalls = [];
	let promptResponse = 'tester';
	window.alert = (msg) => { alertCalls.push(msg); };
	window.prompt = (msg, def) => {
		promptCalls.push({ msg, def });
		return promptResponse;
	};

	if (Array.isArray(randomValues)) {
		let idx = 0;
		window.Math.random = () => {
			const v = randomValues[idx % randomValues.length];
			idx++;
			return v;
		};
	}

	window.eval(script);

	const game = window.myGame;
	const board = game.myBoard;
	const controls = game.myControls;

	const cell = (r, c) => window.document.getElementById(`${r}-${c}`);

	const click = (r, c) => {
		cell(r, c).dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
	};

	const rightClick = (r, c) => {
		cell(r, c).dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
	};

	const mouseDown = (r, c) => {
		cell(r, c).dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
	};

	const mouseUp = () => {
		window.dispatchEvent(new window.Event('mouseup'));
	};

	/**
	 * Replace the auto-generated layout with a deterministic one.
	 * `mineRows` is an array (one entry per row) of strings/arrays where
	 * '*' means mine and anything else means safe.  Counts are recomputed.
	 */
	const installLayout = (mineRows) => {
		const rows = mineRows.length;
		const cols = mineRows[0].length;
		board.rows = rows;
		board.columns = cols;
		board.totalSquares = rows * cols;
		board.hiddenBoard = [];
		board.mineLocations = [];
		for (let i = 0; i < rows; i++) {
			board.hiddenBoard[i] = [];
			for (let j = 0; j < cols; j++) {
				if (mineRows[i][j] === '*') {
					board.hiddenBoard[i][j] = '*';
					board.mineLocations.push(i * cols + j);
				} else {
					board.hiddenBoard[i][j] = '-';
				}
			}
		}
		board.mines = board.mineLocations.length;
		board.countAdjacentMines();
		controls.setMineDisplay(board.mines);
	};

	const setPromptResponse = (s) => { promptResponse = s; };

	const dispose = () => {
		if (game && game.timer) window.clearInterval(game.timer);
		dom.window.close();
	};

	return {
		dom, window, document: window.document,
		game, board, controls,
		cell, click, rightClick, mouseDown, mouseUp,
		installLayout, setPromptResponse,
		alertCalls, promptCalls,
		dispose,
	};
}

/** A handy 8x8 layout used by several tests. Mines at (0,0) and (7,7). */
export function cornerMineLayout() {
	const layout = Array.from({ length: 8 }, () => Array(8).fill('-'));
	layout[0][0] = '*';
	layout[7][7] = '*';
	return layout;
}
