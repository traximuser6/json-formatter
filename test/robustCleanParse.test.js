const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { robustCleanParse } = require('../src/engine.js');

test('parses valid JSON fast-path', () => {
  assert.deepEqual(robustCleanParse('{"a":1}'), { a: 1 });
});

test('fixes single quotes', () => {
  assert.deepEqual(robustCleanParse("{'a': 'b'}"), { a: 'b' });
});

test('removes trailing commas', () => {
  assert.deepEqual(robustCleanParse('{"a":1,}'), { a: 1 });
});

test('quotes unquoted keys', () => {
  assert.deepEqual(robustCleanParse('{a: 1, b: 2}'), { a: 1, b: 2 });
});

test('unwraps stringified JSON', () => {
  assert.deepEqual(robustCleanParse('"{\\"a\\":1}"'), { a: 1 });
});

test('unwraps double-stringified JSON', () => {
  assert.deepEqual(robustCleanParse(JSON.stringify(JSON.stringify({ a: 1 }))), { a: 1 });
});

test('extracts JSON from prose wrapper', () => {
  assert.deepEqual(robustCleanParse('Here is the data: {"a":1} — end'), { a: 1 });
});

test('handles nested stringified values', () => {
  assert.deepEqual(robustCleanParse('{"meta":"{\\"x\\":1}"}'), { meta: { x: 1 } });
});

test('parses fixture and matches expected', () => {
  const messy = fs.readFileSync(path.join(__dirname, 'fixtures/messy.txt'), 'utf8');
  const expected = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures/expected.json'), 'utf8'),
  );
  assert.deepEqual(robustCleanParse(messy), expected);
});

test('throws on empty input', () => {
  assert.throws(() => robustCleanParse(''), /Empty input/);
});

test('throws on non-string input', () => {
  assert.throws(() => robustCleanParse(null), /must be a string/);
});
