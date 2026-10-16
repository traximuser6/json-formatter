#!/usr/bin/env node
/**
 * JSON Cleaner & Formatter — CLI entry
 *
 * Usage:
 *   node src/cli.js
 *   node src/cli.js --input=data.txt
 *   node src/cli.js --output=out.json
 *   node src/cli.js --minify
 *   node src/cli.js --help
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { robustCleanParse } = require('./engine.js');

// ---------- Arg parsing ----------
function parseArgs(argv) {
  const args = {
    input: 'rawdata.txt',
    output: 'cleanJson.json',
    minify: false,
    silent: false,
    help: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--minify' || arg === '-m') args.minify = true;
    else if (arg === '--silent' || arg === '-s') args.silent = true;
    else if (arg.startsWith('--input=')) args.input = arg.slice(8);
    else if (arg.startsWith('--output=')) args.output = arg.slice(9);
  }

  return args;
}

function printHelp() {
  console.log(`
JSON Cleaner & Formatter — CLI

Usage:
  node src/cli.js [options]

Options:
  --input=<file>     Input file (default: rawdata.txt)
  --output=<file>    Output file (default: cleanJson.json)
  --minify, -m       Minify output instead of pretty-print
  --silent, -s       Suppress non-error output
  --help, -h         Show this help

Examples:
  node src/cli.js
  node src/cli.js --input=messy.txt --output=clean.json
  node src/cli.js --minify
`);
}

// ---------- Main ----------
function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const inPath = path.resolve(process.cwd(), args.input);
  const outPath = path.resolve(process.cwd(), args.output);

  if (!fs.existsSync(inPath)) {
    console.error(`❌ Input file not found: ${inPath}`);
    process.exit(1);
  }

  const log = args.silent ? () => {} : (...a) => console.log(...a);

  log(`📖 Reading: ${inPath}`);
  const raw = fs.readFileSync(inPath, 'utf8');
  log(`📏 Size:    ${raw.length} bytes`);

  const start = Date.now();

  try {
    const parsed = robustCleanParse(raw);
    const output = args.minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);

    fs.writeFileSync(outPath, output, 'utf8');

    const ms = Date.now() - start;

    log(`✅ Written: ${outPath}`);
    log(`📏 Output:  ${output.length} bytes`);
    log(`⏱️  Duration: ${ms}ms`);
  } catch (err) {
    console.error(`❌ Parse failed: ${err.message}`);
    process.exit(1);
  }
}

main();
