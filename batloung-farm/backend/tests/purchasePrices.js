const test = require('node:test');
const assert = require('node:assert/strict');
const { PURCHASE_UNIT_COSTS } = require('../src/utils/constants');

test('purchase defaults match the supplied fruit price list', () => {
  assert.deepEqual(PURCHASE_UNIT_COSTS, {
    apple: { SMALL: 120, MEDIUM: 345, LARGE: 467 },
    mango: { SMALL: 195, MEDIUM: 450, LARGE: 670 },
    orange: { SMALL: 76, MEDIUM: 96, LARGE: 112 },
    banana: { SMALL: 80, MEDIUM: 98, LARGE: 134 },
    grape: { SMALL: 123, MEDIUM: 234, LARGE: 345 },
  });
});
