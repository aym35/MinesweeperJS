import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers.js';

/** Layout used by most tests — single mine in the corner so flood-fill works. */
const ONE_CORNER_MINE = [
	'*-------',
	'--------',
	'--------',
	'--------',
	'--------',
	'--------',
	'--------',
	'--------',
];

describe('game — left click', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); ctx.installLayout(ONE_CORNER_MINE); });
	afterEach(() => { ctx.dispose(); });

	it('clicking a far blank cell flood-fills the whole board', () => {
		ctx.click(7, 7);
		// Every safe cell becomes pressed.
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (i === 0 && j === 0) continue; // mine
				const c = ctx.cell(i, j);
				assert.ok(
					c.classList.contains('pressed'),
					`cell ${i},${j} should be pressed but is "${c.className}"`,
				);
				assert.ok(!c.classList.contains('unpressed'));
			}
		}
		// The corner mine is untouched.
		assert.ok(ctx.cell(0, 0).classList.contains('unpressed'));
	});

	it('clicking a numbered cell reveals only that cell', () => {
		// (0,1) is a "1" because it borders the mine at (0,0).
		ctx.click(0, 1);
		assert.ok(ctx.cell(0, 1).classList.contains('pressed'));
		assert.equal(ctx.cell(0, 1).textContent, '1');
		// (3,3) should still be hidden.
		assert.ok(ctx.cell(3, 3).classList.contains('unpressed'));
	});

	it('reveals carry the right .nN class', () => {
		ctx.click(0, 1); // a 1
		assert.ok(ctx.cell(0, 1).classList.contains('n1'));
	});

	it('clicking a mine triggers game over', () => {
		ctx.click(0, 0);
		assert.equal(ctx.game.gameInSession, false);
		assert.ok(ctx.cell(0, 0).classList.contains('exploded'));
		assert.equal(ctx.cell(0, 0).textContent, '*');
		assert.deepEqual(ctx.alertCalls, ['You Lose :(']);
	});

	it('after game over, all mines are revealed', () => {
		ctx.installLayout([
			'*------*',
			'--------',
			'--------',
			'---*----',
			'--------',
			'--------',
			'--------',
			'*------*',
		]);
		ctx.click(0, 0);
		const stars = ['0-0', '0-7', '3-3', '7-0', '7-7']
			.map((id) => ctx.document.getElementById(id).textContent);
		assert.deepEqual(stars, ['*', '*', '*', '*', '*']);
	});

	it('after game over, further clicks do nothing', () => {
		ctx.click(0, 0); // boom
		const before = ctx.cell(3, 3).className;
		ctx.click(3, 3);
		assert.equal(ctx.cell(3, 3).className, before);
	});

	it('clicking an already-revealed cell is a no-op', () => {
		ctx.click(7, 7); // floods
		const c = ctx.cell(7, 7);
		const html = c.outerHTML;
		ctx.click(7, 7);
		assert.equal(c.outerHTML, html);
	});
});

describe('game — right click', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); ctx.installLayout(ONE_CORNER_MINE); });
	afterEach(() => { ctx.dispose(); });

	it('flags an unpressed cell and decrements the mine counter', () => {
		assert.equal(ctx.controls.returnMineDisplay(), 1);
		ctx.rightClick(3, 3);
		assert.ok(ctx.cell(3, 3).classList.contains('flagged'));
		assert.equal(ctx.cell(3, 3).innerHTML, '?');
		assert.equal(ctx.controls.returnMineDisplay(), 0);
	});

	it('un-flags a flagged cell and increments the counter', () => {
		ctx.rightClick(3, 3);
		ctx.rightClick(3, 3);
		assert.ok(!ctx.cell(3, 3).classList.contains('flagged'));
		assert.equal(ctx.controls.returnMineDisplay(), 1);
	});

	it('does NOT flag a revealed cell (regression: original code allowed it)', () => {
		ctx.click(7, 7); // flood
		ctx.rightClick(5, 5); // a now-revealed cell
		assert.ok(!ctx.cell(5, 5).classList.contains('flagged'));
	});

	it('right-click after game over is a no-op', () => {
		ctx.click(0, 0); // boom
		ctx.rightClick(3, 3);
		assert.ok(!ctx.cell(3, 3).classList.contains('flagged'));
	});
});

describe('game — left-click on a flagged cell', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); ctx.installLayout(ONE_CORNER_MINE); });
	afterEach(() => { ctx.dispose(); });

	it('un-flags AND reveals in one click (preserves original behavior)', () => {
		ctx.rightClick(0, 1); // flag the "1" cell
		assert.equal(ctx.controls.returnMineDisplay(), 0);
		ctx.click(0, 1);
		assert.ok(!ctx.cell(0, 1).classList.contains('flagged'));
		assert.ok(ctx.cell(0, 1).classList.contains('pressed'));
		assert.equal(ctx.cell(0, 1).textContent, '1');
		assert.equal(ctx.controls.returnMineDisplay(), 1);
	});

	it('left-clicking a flagged mine still loses without un-flag bookkeeping leaking past', () => {
		ctx.rightClick(0, 0); // flag the mine
		ctx.click(0, 0);      // click anyway → game over
		assert.equal(ctx.game.gameInSession, false);
		assert.equal(ctx.cell(0, 0).textContent, '*');
	});
});

describe('game — flood reveal', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('stops at numbered cells', () => {
		// A wall of mines at row 4 splits the board.
		ctx.installLayout([
			'--------',
			'--------',
			'--------',
			'--------',
			'********',
			'--------',
			'--------',
			'--------',
		]);
		ctx.click(0, 0);
		// Top half (rows 0-3) should reveal.
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 8; j++) {
				assert.ok(ctx.cell(i, j).classList.contains('pressed'),
					`top-half ${i},${j} should be revealed`);
			}
		}
		// Bottom half (rows 5-7) should still be hidden.
		for (let i = 5; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				assert.ok(ctx.cell(i, j).classList.contains('unpressed'),
					`bottom-half ${i},${j} should still be hidden`);
			}
		}
	});

	it('does NOT reveal flagged cells encountered during the flood', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.rightClick(4, 4);
		ctx.click(7, 7);
		assert.ok(ctx.cell(4, 4).classList.contains('flagged'));
		assert.ok(ctx.cell(4, 4).classList.contains('unpressed'));
	});

	it('handles flood from a corner without index errors', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.click(7, 0);
		// Just verify no exception and at least the clicked cell got pressed.
		assert.ok(ctx.cell(7, 0).classList.contains('pressed'));
	});

	it('flood does not stack-overflow on a fully empty large region', () => {
		const empty = Array.from({ length: 8 }, () => '--------');
		ctx.installLayout(empty);
		ctx.click(0, 0);
		// All 64 cells revealed.
		let pressed = 0;
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (ctx.cell(i, j).classList.contains('pressed')) pressed++;
			}
		}
		assert.equal(pressed, 64);
	});
});

describe('game — timer', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); ctx.installLayout(ONE_CORNER_MINE); });
	afterEach(() => { ctx.dispose(); });

	it('does not start until the first click', () => {
		assert.equal(ctx.game.timerStarted, false);
	});

	it('starts on first left-click', () => {
		ctx.click(7, 7);
		assert.equal(ctx.game.timerStarted, true);
	});

	it('starts on first right-click', () => {
		ctx.rightClick(0, 0);
		assert.equal(ctx.game.timerStarted, true);
	});

	it('clears on game over', () => {
		ctx.click(7, 7); // start
		ctx.click(0, 0); // boom
		assert.equal(ctx.game.timerStarted, false);
	});
});

describe('game — restart', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('un-reveals every cell', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.click(7, 7); // flood
		ctx.game.restart();
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				assert.ok(ctx.cell(i, j).classList.contains('unpressed'),
					`cell ${i},${j} should be unpressed after restart`);
			}
		}
	});

	it('resets the timer state', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.click(7, 7);
		ctx.game.timeElapsed = 42;
		ctx.controls.setTimeDisplay(42);
		ctx.game.restart();
		assert.equal(ctx.game.timeElapsed, 0);
		assert.equal(ctx.document.getElementById('time-elapsed').textContent, '0');
		assert.equal(ctx.game.timerStarted, false);
	});

	it('re-enables clicks after game over', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.click(0, 0); // boom
		assert.equal(ctx.game.gameInSession, false);
		ctx.game.restart();
		assert.equal(ctx.game.gameInSession, true);
	});

	it('restores the mine display to the board mine count', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.rightClick(3, 3);
		ctx.rightClick(4, 4);
		assert.equal(ctx.controls.returnMineDisplay(), -1);
		ctx.game.restart();
		// After restart, hiddenBoard is regenerated from real RNG, so it's
		// back to the default 10 mines.
		assert.equal(ctx.controls.returnMineDisplay(), ctx.board.mines);
	});
});

describe('game — face transitions', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); ctx.installLayout(ONE_CORNER_MINE); });
	afterEach(() => { ctx.dispose(); });

	const faceClass = () => ctx.document.getElementById('face-display').className;

	it('starts as bored', () => {
		assert.equal(faceClass(), 'face-bored');
	});

	it('mousedown on a cell shows oh', () => {
		ctx.mouseDown(3, 3);
		assert.equal(faceClass(), 'face-oh');
	});

	it('mouseup anywhere returns to bored', () => {
		ctx.mouseDown(3, 3);
		ctx.mouseUp();
		assert.equal(faceClass(), 'face-bored');
	});

	it('shows sad on game over', () => {
		ctx.click(0, 0);
		assert.equal(faceClass(), 'face-sad');
	});

	it('mousedown after game over does NOT change the face', () => {
		ctx.click(0, 0);
		ctx.mouseDown(3, 3);
		assert.equal(faceClass(), 'face-sad');
	});

	it('clicking the face restarts the game', () => {
		ctx.click(0, 0);
		ctx.document.getElementById('face-display').dispatchEvent(
			new ctx.window.MouseEvent('click', { bubbles: true, cancelable: true })
		);
		assert.equal(ctx.game.gameInSession, true);
		assert.equal(faceClass(), 'face-bored');
	});
});

describe('game — win flow', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	const flagAllAndReveal = () => {
		// Flag the mine, reveal everything else.
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (ctx.board.hiddenBoard[i][j] === '*') {
					ctx.rightClick(i, j);
				}
			}
		}
		ctx.click(7, 7); // flood reveals the rest
	};

	it('triggers when every mine is flagged and every safe cell is revealed', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.setPromptResponse('alice');
		flagAllAndReveal();
		// Alert should have fired with the win message.
		assert.equal(ctx.alertCalls.length, 1);
		assert.match(ctx.alertCalls[0], /winning time/);
		// Winners table should be visible.
		const wt = ctx.document.getElementById('winners-table');
		assert.ok(!wt.classList.contains('hidden'));
		// And contain a row with the name.
		const cells = wt.querySelectorAll('tbody td, td');
		const texts = Array.from(cells).map((c) => c.textContent);
		assert.ok(texts.includes('alice'), `winners table missing name: ${texts.join(',')}`);
	});

	it('does not fire if a non-mine cell is still hidden', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.rightClick(0, 0); // flag the mine; mine display now 0
		// Reveal a single numbered cell only.  (0,1) is a "1".
		ctx.click(0, 1);
		// Lots of cells still hidden, so no win even though display is 0.
		assert.equal(ctx.alertCalls.length, 0);
	});

	it('does not fire if mine display is non-zero (flag count short)', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.click(7, 7); // reveal everything except mine
		// Mine NOT flagged, so display still > 0.
		assert.equal(ctx.alertCalls.length, 0);
	});

	it('flags all over-flagged also do not win (mine display negative)', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.rightClick(0, 0); // mine
		ctx.rightClick(0, 1); // wrong flag
		ctx.click(2, 2);      // floods most of the board
		// mine display = 1 - 2 = -1, so no win even though everything visible
		// is either revealed or flagged.
		assert.equal(ctx.alertCalls.length, 0);
	});
});

describe('game — XSS regression on winners table', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('treats name as text, not HTML', () => {
		ctx.installLayout(ONE_CORNER_MINE);
		ctx.setPromptResponse('<img src=x onerror="alert(99)">');
		// Walk the win path.
		ctx.rightClick(0, 0);
		ctx.click(7, 7);
		// Alert called once (the win message), NOT twice (no XSS firing).
		assert.equal(ctx.alertCalls.length, 1);
		// The name cell should have no element children.
		const wt = ctx.document.getElementById('winners-table');
		const tds = wt.querySelectorAll('td');
		// Find the row containing the literal injected string.
		const found = Array.from(tds).some((td) => td.children.length === 0
			&& td.textContent.includes('<img'));
		assert.ok(found, 'expected literal <img string in a name cell');
		// And no <img> tag should have been created.
		assert.equal(wt.querySelectorAll('img').length, 0);
	});
});
