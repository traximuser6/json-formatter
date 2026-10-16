/**
 * engine.js — Repair pipeline (CommonJS for Node)
 * Shared by src/cli.js and test files.
 */

'use strict';

const MAX_INPUT = 5_000_000;

function stripBOM(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/^\uFEFF/, '').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '');
}

function stripControlChars(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function normalizeLineEndings(s) {
  return s.replace(/\r\n?/g, '\n').replace(/[\u2028\u2029]/g, '\n');
}

function extractFirstJsonLike(text) {
  const openers = { '{': '}', '[': ']' };
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') {
      start = i;
      break;
    }
  }
  if (start < 0) return text;

  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        continue;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') stack.push(openers[ch]);
    else if (ch === '}' || ch === ']') {
      if (stack.length === 0) break;
      const expected = stack.pop();
      if (ch !== expected) break;
      if (stack.length === 0) return text.slice(start, i + 1);
    }
  }
  const lastClose = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  return lastClose > start ? text.slice(start, lastClose + 1) : text.slice(start);
}

function removeTrailingCommas(text) {
  let out = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === ',') {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === '}' || text[j] === ']') continue;
    }
    out += ch;
  }
  return out;
}

function singleToDoubleQuotes(text) {
  let out = '';
  let inDouble = false;
  let inSingle = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inDouble) {
      out += ch;
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inDouble = false;
      continue;
    }
    if (inSingle) {
      if (escape) {
        out += ch;
        escape = false;
      } else if (ch === '\\') {
        out += ch;
        escape = true;
      } else if (ch === "'") {
        out += '"';
        inSingle = false;
      } else if (ch === '"') {
        out += '\\"';
      } else {
        out += ch;
      }
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      out += ch;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      out += '"';
      continue;
    }
    out += ch;
  }
  return out;
}

function quoteUnquotedKeys(text) {
  let out = '';
  let inString = false;
  let escape = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      i++;
      continue;
    }
    if (ch === '{' || ch === ',') {
      out += ch;
      i++;
      while (i < text.length && /\s/.test(text[i])) {
        out += text[i];
        i++;
      }
      // FIX: no useless escape — inside [] the "-" doesn't need escaping
      const m = /^([A-Za-z_$][A-Za-z0-9_$@-]*)\s*:/.exec(text.slice(i));
      if (m) {
        out += '"' + m[1] + '":';
        i += m[0].length;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function collapseBackslashes(text) {
  return text.replace(/\\{2,}/g, (m) =>
    '\\'.repeat(m.length % 2 === 0 ? m.length / 2 : Math.ceil(m.length / 2)),
  );
}

function unescapeForwardSlash(text) {
  return text.replace(/\\\//g, '/');
}

const repairSteps = [
  stripBOM,
  normalizeLineEndings,
  stripControlChars,
  extractFirstJsonLike,
  unescapeForwardSlash,
  collapseBackslashes,
  removeTrailingCommas,
  singleToDoubleQuotes,
  quoteUnquotedKeys,
];

function isProbablyStringifiedJson(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

function deepUnwrapStrings(value, depth = 0) {
  if (depth > 6) return value;
  if (typeof value === 'string') {
    const t = value.trim();
    if (isProbablyStringifiedJson(t)) {
      try {
        const inner = robustCleanParse(t, { maxPasses: 3, maxUnwrap: 2, silent: true });
        return deepUnwrapStrings(inner, depth + 1);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => deepUnwrapStrings(v, depth + 1));
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) value[k] = deepUnwrapStrings(value[k], depth + 1);
    return value;
  }
  return value;
}

function robustCleanParse(raw, options = {}) {
  const { maxPasses = 8, maxUnwrap = 5, silent = true } = options;
  if (typeof raw !== 'string') throw new Error('Input must be a string.');
  const s = raw.trim();
  if (s.length === 0) throw new Error('Empty input.');
  if (s.length > MAX_INPUT) throw new Error(`Input too large (>${MAX_INPUT} bytes).`);

  try {
    return deepUnwrapStrings(JSON.parse(s));
  } catch (e) {
    if (!silent) console.debug('[engine] fast-path failed:', e.message);
  }

  for (let pass = 0; pass <= maxPasses; pass++) {
    let candidate = s;
    for (let i = 0; i <= pass && i < repairSteps.length; i++) {
      candidate = repairSteps[i](candidate);
    }
    let temp = candidate;
    let unwrapCount = 0;
    while (unwrapCount <= maxUnwrap) {
      try {
        return deepUnwrapStrings(JSON.parse(temp));
      } catch {
        const m = temp.match(/^\s*"(.*)"\s*$/s);
        if (m) {
          const inner = m[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
          if (inner !== temp) {
            temp = inner;
            unwrapCount++;
            continue;
          }
        }
        const extracted = extractFirstJsonLike(temp);
        if (extracted !== temp) {
          temp = extracted;
          unwrapCount++;
          continue;
        }
        break;
      }
    }
  }

  throw new Error('Unable to parse JSON after all repair attempts.');
}

module.exports = { robustCleanParse, deepUnwrapStrings };
