import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers.js';

describe('board', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	describe('cellId / parseId', () => {
		it('round-trips coordinates', () => {
			const id = ctx.board.cellId(3, 5);
			assert.equal(id, '3-5');
			const p = ctx.board.parseId(id);
			assert.equal(p.row, 3);
			assert.equal(p.col, 5);
		});

		it('handles two-digit indices (regression: was id[0]/id[2])', () => {
			const id = ctx.board.cellId(12, 25);
			const p = ctx.board.parseId(id);
			assert.equal(p.row, 12);
			assert.equal(p.col, 25);
		});
	});

	describe('initialize', () => {
		it('creates rows*columns td elements', () => {
			const cells = ctx.document.querySelectorAll('#myTable td.unpressed');
			assert.equal(cells.length, 64);
		});

		it('every cell has an id and the unpressed class', () => {
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					const c = ctx.cell(i, j);
					assert.ok(c, `cell ${i},${j} missing`);
					assert.equal(c.id, `${i}-${j}`);
					assert.ok(c.classList.contains('unpressed'));
				}
			}
		});
	});

	describe('generateMines', () => {
		it('produces exactly `mines` locations', () => {
			assert.equal(ctx.board.mineLocations.length, 10);
		});

		it('all mine locations are unique', () => {
			const set = new Set(ctx.board.mineLocations);
			assert.equal(set.size, ctx.board.mineLocations.length);
		});

		it('all mine locations are within range', () => {
			for (const loc of ctx.board.mineLocations) {
				assert.ok(loc >= 0 && loc < 64, `loc ${loc} out of range`);
			}
		});

		it('resets locations array on each call (regression for restart bias)', () => {
			const first = ctx.board.mineLocations.slice();
			ctx.board.generateMines();
			const second = ctx.board.mineLocations;
			assert.equal(second.length, 10);
			assert.equal(new Set(second).size, 10);
			// Second call shouldn't have ghost entries from the first.  We
			// can't assert the layouts differ (random), but we *can* assert
			// the array isn't longer than `mines`.
			assert.equal(second.length, ctx.board.mines);
			assert.notStrictEqual(second, first);
		});

		it('after 50 regenerations, mine cells span the board (no permanent dead zones)', () => {
			const seen = new Set();
			for (let i = 0; i < 50; i++) {
				ctx.board.generateMines();
				for (const loc of ctx.board.mineLocations) seen.add(loc);
			}
			// 50 trials × 10 mines / 64 cells — vanishingly unlikely we miss any.
			assert.equal(seen.size, 64, `only saw ${seen.size}/64 cells across 50 generations`);
		});
	});

	describe('plantMines', () => {
		it('writes `*` to hiddenBoard at every mine location', () => {
			let stars = 0;
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					if (ctx.board.hiddenBoard[i][j] === '*') stars++;
				}
			}
			assert.equal(stars, 10);
		});

		it('uses columns (not rows) when decoding linear indices', () => {
			// Pick a specific linear index and verify it maps to the right cell.
			ctx.board.mineLocations = [0, 7, 8, 56, 63];
			ctx.board.mines = 5;
			ctx.board.hiddenBoard = Array.from({ length: 8 }, () => Array(8).fill('-'));
			ctx.board.plantMines();
			assert.equal(ctx.board.hiddenBoard[0][0], '*');
			assert.equal(ctx.board.hiddenBoard[0][7], '*');
			assert.equal(ctx.board.hiddenBoard[1][0], '*');
			assert.equal(ctx.board.hiddenBoard[7][0], '*');
			assert.equal(ctx.board.hiddenBoard[7][7], '*');
		});
	});

	describe('countAdjacentMines', () => {
		it('marks an isolated mine surrounded by 1s', () => {
			ctx.installLayout([
				'--------',
				'--------',
				'--------',
				'---*----',
				'--------',
				'--------',
				'--------',
				'--------',
			]);
			assert.equal(ctx.board.hiddenBoard[2][2], 1);
			assert.equal(ctx.board.hiddenBoard[2][3], 1);
			assert.equal(ctx.board.hiddenBoard[2][4], 1);
			assert.equal(ctx.board.hiddenBoard[3][2], 1);
			assert.equal(ctx.board.hiddenBoard[3][4], 1);
			assert.equal(ctx.board.hiddenBoard[4][2], 1);
			assert.equal(ctx.board.hiddenBoard[4][3], 1);
			assert.equal(ctx.board.hiddenBoard[4][4], 1);
			// Far cells stay blank
			assert.equal(ctx.board.hiddenBoard[0][0], '-');
			assert.equal(ctx.board.hiddenBoard[7][7], '-');
		});

		it('handles corner mines without index errors (regression for try/catch)', () => {
			ctx.installLayout([
				'*------*',
				'--------',
				'--------',
				'--------',
				'--------',
				'--------',
				'--------',
				'*------*',
			]);
			assert.equal(ctx.board.hiddenBoard[0][1], 1);
			assert.equal(ctx.board.hiddenBoard[1][0], 1);
			assert.equal(ctx.board.hiddenBoard[1][1], 1);
			assert.equal(ctx.board.hiddenBoard[0][6], 1);
			assert.equal(ctx.board.hiddenBoard[6][7], 1);
			assert.equal(ctx.board.hiddenBoard[7][6], 1);
		});

		it('counts up to 8 for a fully-surrounded cell', () => {
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
		});

		it('does not overwrite a mine cell with a count', () => {
			ctx.installLayout([
				'**------',
				'--------',
				'--------',
				'--------',
				'--------',
				'--------',
				'--------',
				'--------',
			]);
			assert.equal(ctx.board.hiddenBoard[0][0], '*');
			assert.equal(ctx.board.hiddenBoard[0][1], '*');
		});
	});

	describe('parameterised constructor', () => {
		it('accepts custom rows/columns/mines', () => {
			// Need a fresh DOM with a #myTable so the new board can attach.
			ctx.document.getElementById('myTable').innerHTML = '';
			const Board = ctx.window.board;
			const b = new Board(5, 6, 4);
			assert.equal(b.rows, 5);
			assert.equal(b.columns, 6);
			assert.equal(b.mines, 4);
			assert.equal(b.totalSquares, 30);
		});

		it('falls back to 8x8/10 defaults', () => {
			const Board = ctx.window.board;
			const b = new Board();
			assert.equal(b.rows, 8);
			assert.equal(b.columns, 8);
			assert.equal(b.mines, 10);
		});
	});
});
