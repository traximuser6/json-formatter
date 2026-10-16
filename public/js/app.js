/* ============================================================
 * app.js — UI wiring (ES module)
 * ============================================================ */

import {robustCleanParse} from './engine.js';
import {randomSample} from './sample.js';

// ---------- DOM ----------
const uncleanEl = document.getElementById('uncleanJson');
const cleanEl = document.getElementById('cleanJson');
const diagEl = document.getElementById('diagnostics');
const parseBtn = document.getElementById('parseButton');
const beautifyBtn = document.getElementById('beautifyButton');
const minifyBtn = document.getElementById('minifyButton');
const repairBtn = document.getElementById('repairOnlyButton');
const copyInputBtn = document.getElementById('copyInput');
const copyOutputBtn = document.getElementById('copyOutput');
const downloadBtn = document.getElementById('downloadOutput');
const sampleBtn = document.getElementById('sampleBtn');
const clearBtn = document.getElementById('clearInput');
const loader = document.getElementById('loader');

document.getElementById('year').textContent = new Date().getFullYear();

toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  timeOut: 3500,
};

// ---------- Helpers ----------
function logDiag(...args) {
  const line = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  diagEl.textContent = `[${new Date().toISOString()}] ${line}\n` + diagEl.textContent;
  console.debug(line);
}

function showLoader() {
  loader.classList.remove('hidden');
  loader.classList.add('flex');
  [parseBtn, beautifyBtn, minifyBtn, repairBtn].forEach((b) => (b.disabled = true));
}

function hideLoader() {
  loader.classList.add('hidden');
  loader.classList.remove('flex');
  [parseBtn, beautifyBtn, minifyBtn, repairBtn].forEach((b) => (b.disabled = false));
}

function downloadText(filename, text) {
  const blob = new Blob([text], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function assertRoundTrip(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// ---------- Actions ----------
async function runAction(label, transform) {
  diagEl.textContent = '';
  const raw = uncleanEl.value.trim();
  if (!raw) return toastr.info('Paste JSON first.');

  showLoader();
  const start = performance.now();
  try {
    const parsed = robustCleanParse(raw);
    const output = transform(parsed);
    if (!assertRoundTrip(output)) throw new Error('Output failed round-trip validation.');
    cleanEl.value = output;
    const t = ((performance.now() - start) / 1000).toFixed(3);
    toastr.success(`${label} in ${t}s ✅`);
    logDiag(`${label}:`, output.length, 'chars');
  } catch (err) {
    toastr.error(`${label} failed: ${err.message}`);
    logDiag('Error:', err.message);
  } finally {
    hideLoader();
  }
}

parseBtn.addEventListener('click', () => runAction('Cleaned & formatted', (p) => JSON.stringify(p, null, 2)));
beautifyBtn.addEventListener('click', () => runAction('Beautified', (p) => JSON.stringify(p, null, 2)));
minifyBtn.addEventListener('click', () => runAction('Minified', (p) => JSON.stringify(p)));
repairBtn.addEventListener('click', () => runAction('Repaired', (p) => JSON.stringify(p)));

copyInputBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(uncleanEl.value);
    toastr.success('Input copied');
  } catch (e) {
    toastr.error('Copy failed');
    logDiag('Copy error:', e);
  }
});

copyOutputBtn.addEventListener('click', async () => {
  if (!cleanEl.value) return toastr.info('No output to copy');
  try {
    await navigator.clipboard.writeText(cleanEl.value);
    toastr.success('Output copied');
  } catch (e) {
    toastr.error('Copy failed');
    logDiag('Copy error:', e);
  }
});

downloadBtn.addEventListener('click', () => {
  if (!cleanEl.value) return toastr.info('No output to download');
  downloadText('cleaned.json', cleanEl.value);
  toastr.success('Downloaded cleaned.json');
});

sampleBtn.addEventListener('click', () => {
  try {
    uncleanEl.value = randomSample();
    cleanEl.value = '';
    diagEl.textContent = '';
    toastr.info('Random sample inserted');
  } catch (err) {
    console.error('[sample] failed:', err);
    toastr.error('Sample generation failed — see console');
  }
});

clearBtn.addEventListener('click', () => {
  uncleanEl.value = '';
  cleanEl.value = '';
  diagEl.textContent = '';
  toastr.info('Cleared');
});

// Expose for console testing
window.__jsonTool = {robustCleanParse, randomSample};

logDiag('Tool ready. Use window.__jsonTool in console.');