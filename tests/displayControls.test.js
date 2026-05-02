import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers.js';

describe('displayControls', () => {
	let ctx;
	beforeEach(() => { ctx = loadGame(); });
	afterEach(() => { ctx.dispose(); });

	it('initializes mine display to the board mine count', () => {
		assert.equal(ctx.controls.returnMineDisplay(), 10);
		assert.equal(ctx.document.getElementById('mines-left').textContent, '10');
	});

	it('initializes time display to 0', () => {
		assert.equal(ctx.controls.returnTimeDisplay(), 0);
		assert.equal(ctx.document.getElementById('time-elapsed').textContent, '0');
	});

	it('setMineDisplay updates value and DOM', () => {
		ctx.controls.setMineDisplay(7);
		assert.equal(ctx.controls.returnMineDisplay(), 7);
		assert.equal(ctx.document.getElementById('mines-left').textContent, '7');
	});

	it('setTimeDisplay updates value and DOM', () => {
		ctx.controls.setTimeDisplay(42);
		assert.equal(ctx.controls.returnTimeDisplay(), 42);
		assert.equal(ctx.document.getElementById('time-elapsed').textContent, '42');
	});

	it('adjustMineDisplay(+1) increments', () => {
		ctx.controls.setMineDisplay(5);
		ctx.controls.adjustMineDisplay(1);
		assert.equal(ctx.controls.returnMineDisplay(), 6);
		assert.equal(ctx.document.getElementById('mines-left').textContent, '6');
	});

	it('adjustMineDisplay(-1) decrements', () => {
		ctx.controls.setMineDisplay(5);
		ctx.controls.adjustMineDisplay(-1);
		assert.equal(ctx.controls.returnMineDisplay(), 4);
	});

	it('mine display can go negative (current behavior — flagging more cells than mines)', () => {
		ctx.controls.setMineDisplay(0);
		ctx.controls.adjustMineDisplay(-1);
		assert.equal(ctx.controls.returnMineDisplay(), -1);
	});

	it('writes via textContent so HTML is escaped', () => {
		ctx.controls.setMineDisplay('<img src=x>');
		// textContent treats it as a string, so it should appear literally.
		assert.equal(ctx.document.getElementById('mines-left').textContent, '<img src=x>');
		assert.equal(ctx.document.getElementById('mines-left').children.length, 0);
	});
});
