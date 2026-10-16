const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, 'tmp');
const CLI = path.join(ROOT, 'src', 'cli.js');

test.before(() => {
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
});

test('CLI cleans messy input and writes output', () => {
  const inFile = path.join(TMP, 'in.txt');
  const outFile = path.join(TMP, 'out.json');

  fs.writeFileSync(inFile, "{ name: 'John', age: 30, }");

  execFileSync('node', [CLI, `--input=${inFile}`, `--output=${outFile}`, '--silent']);

  assert.ok(fs.existsSync(outFile), 'Output file should exist');
  const parsed = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.deepEqual(parsed, { name: 'John', age: 30 });
});

test('CLI minify flag produces compact output', () => {
  const inFile = path.join(TMP, 'in2.txt');
  const outFile = path.join(TMP, 'out2.json');

  fs.writeFileSync(inFile, '{ "a" : 1 }');

  execFileSync('node', [CLI, `--input=${inFile}`, `--output=${outFile}`, '--minify', '--silent']);

  const content = fs.readFileSync(outFile, 'utf8');
  assert.equal(content, '{"a":1}');
});

test('CLI exits with error on missing input', () => {
  assert.throws(() =>
    execFileSync('node', [CLI, '--input=does-not-exist.txt', '--silent'], { stdio: 'pipe' }),
  );
});
