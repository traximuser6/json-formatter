const test = require('node:test');
const assert = require('node:assert/strict');
const { robustCleanParse } = require('./_engine.js');

const cases = [
  ['valid', '{"a":1}', { a: 1 }],
  ['single quotes', "{'a':'b'}", { a: 'b' }],
  ['unquoted keys', '{a:1,b:2}', { a: 1, b: 2 }],
  ['trailing comma', '{"a":1,}', { a: 1 }],
  ['double encoded', '"{\\"a\\":1}"', { a: 1 }],
  ['triple encoded', JSON.stringify(JSON.stringify(JSON.stringify({ a: 1 }))), { a: 1 }],
  ['wrapped prose', 'Data: {"a":1} — end', { a: 1 }],
  ['BOM prefix', '\uFEFF{"a":1}', { a: 1 }],
  ['nested strings', '{"meta":"{\\"x\\":1}"}', { meta: { x: 1 } }],
  ['mixed quotes', '{ "a" : \'b\' , \'c\' : "d" }', { a: 'b', c: 'd' }],
  ['numbers', '{"n":1.5,"m":-3e2}', { n: 1.5, m: -300 }],
  ['nulls', '{"n":null}', { n: null }],
  ['booleans', '{"t":true,"f":false}', { t: true, f: false }],
  ['empty array', '{"a":[]}', { a: [] }],
  ['empty object', '{"a":{}}', { a: {} }],
];

for (const [name, input, expected] of cases) {
  test(`variant: ${name}`, () => {
    const out = robustCleanParse(input);
    assert.deepEqual(out, expected);
  });
}

test('throws on completely broken input', () => {
  assert.throws(() => robustCleanParse('%%% not json at all %%%'));
});
