/**
 * Tests for the robustCleanParse engine.
 * Run: node --test test/
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Load the CLI module's exported functions by re-requiring main.js would run it.
// Instead, inline a lightweight loader: we eval the relevant portion.
// Simpler approach: expose via a helper module.

// To keep tests simple and fast, we import from script.js-compatible code.
// For this project, we duplicate the pipeline in a testable module.
// See: ./_engine.js (created below).

const { robustCleanParse } = require('./_engine.js');

test('parses valid JSON fast-path', () => {
  const out = robustCleanParse('{"a":1}');
  assert.deepEqual(out, { a: 1 });
});

test('fixes single quotes', () => {
  const out = robustCleanParse("{'a': 'b'}");
  assert.deepEqual(out, { a: 'b' });
});

test('removes trailing commas', () => {
  const out = robustCleanParse('{"a":1,}');
  assert.deepEqual(out, { a: 1 });
});

test('quotes unquoted keys', () => {
  const out = robustCleanParse('{a: 1, b: 2}');
  assert.deepEqual(out, { a: 1, b: 2 });
});

test('unwraps stringified JSON', () => {
  const out = robustCleanParse('"{\\"a\\":1}"');
  assert.deepEqual(out, { a: 1 });
});

test('unwraps double-stringified JSON', () => {
  const out = robustCleanParse(JSON.stringify(JSON.stringify({ a: 1 })));
  assert.deepEqual(out, { a: 1 });
});

test('extracts JSON from prose wrapper', () => {
  const out = robustCleanParse('Here is the data: {"a":1} — end');
  assert.deepEqual(out, { a: 1 });
});

test('handles nested stringified values', () => {
  const out = robustCleanParse('{"meta":"{\\"x\\":1}"}');
  assert.deepEqual(out, { meta: { x: 1 } });
});

test('parses fixture and matches expected', () => {
  const messy = fs.readFileSync(path.join(__dirname, 'fixtures/messy.json'), 'utf8');
  const expected = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures/expected.json'), 'utf8'),
  );
  const out = robustCleanParse(messy);
  assert.deepEqual(out, expected);
});

test('throws on empty input', () => {
  assert.throws(() => robustCleanParse(''), /Empty input/);
});

test('throws on non-string input', () => {
  assert.throws(() => robustCleanParse(null), /must be a string/);
});
