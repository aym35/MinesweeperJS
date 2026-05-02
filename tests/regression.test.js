/**
 * Tests that pin specific bugs identified in the code review.
 * Each test names the issue it guards against.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers.js';

describe('regression: mineLocations was never reset on restart', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('after 100 restarts every cell is reachable as a mine', () => {
		// Original bug: stale entries from the previous game lingered in
		// `mineLocations`, so a restart's dedup check excluded those cells.
		// Across many restarts that would still average out, but never quite
		// — and any cell flagged in the *first* game would be statistically
		// less likely on the next.  After this fix every cell is fair game.
		const seen = new Set();
		for (let i = 0; i < 100; i++) {
			ctx.game.restart();
			for (const loc of ctx.board.mineLocations) seen.add(loc);
		}
		assert.equal(seen.size, 64);
	});

	it('mineLocations array length never exceeds `mines` after restart', () => {
		for (let i = 0; i < 20; i++) {
			ctx.game.restart();
			assert.equal(ctx.board.mineLocations.length, ctx.board.mines);
		}
	});
});

describe('regression: id parsing was id[0]/id[2]', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('parseId works for two-digit row/col', () => {
		const p = ctx.board.parseId('12-34');
		assert.equal(p.row, 12);
		assert.equal(p.col, 34);
	});

	it('parseId returns numbers, not strings', () => {
		const p = ctx.board.parseId('3-5');
		assert.equal(typeof p.row, 'number');
		assert.equal(typeof p.col, 'number');
	});
});

describe('regression: row/col math used `% rows` instead of `% columns`', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('plantMines decodes linear indices using columns', () => {
		// Linear index 8 with columns=8 should be (1,0).  The old code did
		// `loc % rows` which only happens to work when rows == columns.
		ctx.board.mineLocations = [8];
		ctx.board.mines = 1;
		ctx.board.hiddenBoard = Array.from({ length: 8 }, () => Array(8).fill('-'));
		ctx.board.plantMines();
		assert.equal(ctx.board.hiddenBoard[1][0], '*');
		assert.equal(ctx.board.hiddenBoard[0][1], '-'); // would have been '*' under the old math
	});
});

describe('regression: try/catch was used for bounds checking', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('countAdjacentMines does not silently swallow real errors', () => {
		// If we corrupt the board so an access throws something *other* than
		// out-of-bounds, the new code should surface it.  We simulate by
		// replacing one row with a getter that throws.
		ctx.installLayout([
			'*-------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
		]);
		const sentinel = new Error('synthetic');
		Object.defineProperty(ctx.board.hiddenBoard, '0', {
			get() { throw sentinel; },
		});
		assert.throws(() => ctx.board.countAdjacentMines(), (err) => err === sentinel);
	});
});

describe('regression: revealing a flagged cell left the .flagged class behind', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('flagged blank cell, when left-clicked, ends up un-flagged', () => {
		ctx.installLayout([
			'*-------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
		]);
		ctx.rightClick(4, 4); // flag a blank cell
		assert.ok(ctx.cell(4, 4).classList.contains('flagged'));
		ctx.click(4, 4);
		assert.ok(!ctx.cell(4, 4).classList.contains('flagged'),
			'flagged class should be cleared after left-clicking through');
	});
});

describe('regression: state was tracked via innerHTML comparisons', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('checkIfWon uses class checks, not innerHTML', () => {
		// Set up a "ready to win" state without touching innerHTML directly.
		ctx.installLayout([
			'*-------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
		]);
		ctx.rightClick(0, 0);
		ctx.click(7, 7); // floods, leaving only the flagged mine hidden
		// Win triggered via class state.
		assert.equal(ctx.alertCalls.length, 1);
	});
});

describe('regression: number colors only covered 1-4', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('a cell with 8 adjacent mines gets the n8 class on reveal', () => {
		ctx.installLayout([
			'***-----',
			'*-*-----',
			'***-----',
			'--------',
			'--------',
			'--------',
			'--------',
			'--------',
		]);
		assert.equal(ctx.board.hiddenBoard[1][1], 8);
		ctx.click(1, 1);
		assert.ok(ctx.cell(1, 1).classList.contains('n8'),
			`expected n8 class, got "${ctx.cell(1, 1).className}"`);
	});

	it('cells with values 5/6/7/8 each get their own .nN class', () => {
		// Build a layout where the cell at (3,3) sees N mines, then assert.
		const cases = [
			{ n: 5, mines: [[2,2],[2,3],[2,4],[3,2],[3,4]] },
			{ n: 6, mines: [[2,2],[2,3],[2,4],[3,2],[3,4],[4,2]] },
			{ n: 7, mines: [[2,2],[2,3],[2,4],[3,2],[3,4],[4,2],[4,3]] },
			{ n: 8, mines: [[2,2],[2,3],[2,4],[3,2],[3,4],[4,2],[4,3],[4,4]] },
		];
		for (const { n, mines } of cases) {
			const c2 = loadGame();
			const layout = Array.from({ length: 8 }, () => Array(8).fill('-'));
			for (const [r, c] of mines) layout[r][c] = '*';
			c2.installLayout(layout);
			assert.equal(c2.board.hiddenBoard[3][3], n, `setup wrong for n=${n}`);
			c2.click(3, 3);
			assert.ok(c2.cell(3, 3).classList.contains('n' + n),
				`n=${n}: expected class n${n}, got "${c2.cell(3, 3).className}"`);
			c2.dispose();
		}
	});
});

describe('regression: HTML doctype and structure', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('renders in standards mode (doctype present)', () => {
		assert.equal(ctx.document.compatMode, 'CSS1Compat',
			'expected standards mode (CSS1Compat), got ' + ctx.document.compatMode);
	});

	it('main table uses <thead>, not <th> wrapping <tr>', () => {
		const myTable = ctx.document.getElementById('myTable');
		assert.ok(myTable.querySelector('thead'), 'expected a <thead>');
	});

	it('winners table has proper <thead> with <th> headers', () => {
		const wt = ctx.document.getElementById('winners-table');
		assert.ok(wt.querySelector('thead'));
		const ths = wt.querySelectorAll('thead th');
		assert.equal(ths.length, 2);
		assert.equal(ths[0].textContent, 'Name');
		assert.equal(ths[1].textContent, 'Time');
	});
});

describe('regression: mouseup listener was attached 64 times', () => {
	it('only one window-level mouseup listener fires per event', () => {
		const ctx = loadGame();
		try {
			ctx.installLayout([
				'*-------', '--------', '--------', '--------',
				'--------', '--------', '--------', '--------',
			]);
			let calls = 0;
			const orig = ctx.window.document.getElementById;
			ctx.window.document.getElementById = function (id) {
				if (id === 'face-display') calls++;
				return orig.call(this, id);
			};
			ctx.mouseUp();
			// gameInSession is true → exactly one face-display lookup.
			assert.equal(calls, 1, `expected 1 lookup, got ${calls}`);
		} finally {
			ctx.dispose();
		}
	});
});
