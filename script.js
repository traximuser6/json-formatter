document.getElementById('year').textContent = new Date().getFullYear();

toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "timeOut": "4000"
};

const uncleanEl = document.getElementById('uncleanJson');
const cleanEl = document.getElementById('cleanJson');
const diagEl = document.getElementById('diagnostics');
const parseBtn = document.getElementById('parseButton');
const beautifyBtn = document.getElementById('beautifyButton');
const minifyBtn = document.getElementById('minifyButton');
const copyInputBtn = document.getElementById('copyInput');
const copyOutputBtn = document.getElementById('copyOutput');
const downloadBtn = document.getElementById('downloadOutput');
const sampleBtn = document.getElementById('sampleBtn');
const clearInputBtn = document.getElementById('clearInput');

function logDiag(...args) {
    console.log(...args);
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a, null, 2)).join(' ');
    diagEl.textContent = `${new Date().toISOString()} — ${message}\n` + diagEl.textContent;
}

function downloadText(filename, text) {
    const blob = new Blob([text], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function robustCleanParse(rawString, opts = {maxUnwrap: 6, maxRepairPasses: 6}) {
    let s = (rawString || '').trim();
    if (s.length > 5_000_000) throw new Error('Input too large (>5MB).');

    function extractFirstJsonLike(text) {
        const m = text.match(/([\[\{][\s\S]*[\}\]])/);
        return m ? m[1] : text;
    }

    function removeControlChars(text) {
        return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    function removeTrailingCommas(text) {
        return text.replace(/,\s*(?=[}\]])/g, '');
    }

    function singleToDoubleQuotes(text) {
        return text.replace(/'([^'\r\n]*?)'(?=\s*[:,\}|\]])/g, '"$1"')
            .replace(/:\s*'([^'\r\n]*?)'/g, ': "$1"')
            .replace(/'([A-Za-z0-9_\-@\.]+)'\s*:/g, '"$1":');
    }

    function quoteUnquotedKeys(text) {
        return text.replace(/([{\s,])([A-Za-z0-9_\-$@]+)\s*:/g, '$1"$2":');
    }

    function collapseBackslashes(text) {
        return text.replace(/\\\\+/g, m => m.length % 2 === 0 ? '\\\\' : '\\');
    }

    function unescapeForwardSlash(text) {
        return text.replace(/\\\//g, '/');
    }

    function normalizeWhitespace(text) {
        return text.replace(/\t/g, '  ');
    }

    const repairPasses = [
        s => s,
        extractFirstJsonLike,
        removeControlChars,
        unescapeForwardSlash,
        collapseBackslashes,
        removeTrailingCommas,
        singleToDoubleQuotes,
        quoteUnquotedKeys,
        normalizeWhitespace
    ];

    let parsed = null;
    let lastErr = null;
    let attempts = [];

    for (let pass = 0; pass < opts.maxRepairPasses; pass++) {
        try {
            let candidate = s;
            for (let i = 0; i <= pass; i++) {
                candidate = repairPasses[i % repairPasses.length](candidate);
            }
            attempts.push({pass, snippet: candidate.slice(0, 300)});

            let unwrapCount = 0;
            let temp = candidate;
            while (unwrapCount < opts.maxUnwrap) {
                try {
                    parsed = JSON.parse(temp);
                    logDiag(`Parse succeeded on pass ${pass} after ${unwrapCount} unwraps.`);
                    break;
                } catch (err) {
                    lastErr = err;
                    const m = temp.match(/^[\s]*["']([\s\S]*)["'][\s]*$/);
                    if (m) {
                        temp = m[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\+/g, m => m.length % 2 === 0 ? '\\\\' : '\\');
                        unwrapCount++;
                        continue;
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
            if (parsed) break;
        } catch (err) {
            lastErr = err;
        }
    }

    if (!parsed) {
        try {
            let candidate = s.replace(/\\n/g, '\\n').replace(/\\t/g, '\\t');
            candidate = extractFirstJsonLike(candidate);
            candidate = removeTrailingCommas(candidate);
            candidate = collapseBackslashes(candidate);
            parsed = JSON.parse(candidate);
            logDiag('Fallback parse succeeded.');
        } catch (err) {
            lastErr = err;
        }
    }

    if (!parsed) {
        logDiag('All attempts failed.', {attempts});
        throw new Error(`Unable to parse: ${lastErr?.message || 'unknown'}`);
    }

    function recursivelyParseStrings(obj) {
        if (typeof obj === 'string') {
            const trimmed = obj.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    return robustCleanParse(trimmed, {maxUnwrap: 3, maxRepairPasses: 3});
                } catch (e) {
                    return obj;
                }
            }
            return obj;
        } else if (Array.isArray(obj)) {
            return obj.map(recursivelyParseStrings);
        } else if (obj && typeof obj === 'object') {
            for (const k in obj) obj[k] = recursivelyParseStrings(obj[k]);
            return obj;
        }
        return obj;
    }

    try {
        parsed = recursivelyParseStrings(parsed);
    } catch (e) {
        logDiag('Warning in recursive parse:', e.message);
    }

    return parsed;
}

function formatJson(obj, space = 2) {
    return JSON.stringify(obj, null, space);
}

function minifyJson(obj) {
    return JSON.stringify(obj);
}

parseBtn.addEventListener('click', () => {
    diagEl.textContent = '';
    cleanEl.value = '';
    const raw = uncleanEl.value.trim();
    if (!raw) return toastr.info('Paste JSON first.');
    try {
        const parsed = robustCleanParse(raw);
        cleanEl.value = formatJson(parsed);
        toastr.success('Cleaned successfully ✅');
        logDiag('Output length:', cleanEl.value.length, 'chars');
    } catch (err) {
        toastr.error('Parsing failed — check diagnostics.');
        logDiag('Error:', err.message);
    }
});

beautifyBtn.addEventListener('click', () => {
    diagEl.textContent = '';
    const raw = uncleanEl.value.trim();
    if (!raw) return toastr.info('No input.');
    try {
        const p = JSON.parse(raw);
        cleanEl.value = formatJson(p);
        toastr.success('Beautified with native parse');
    } catch (e) {
        try {
            const parsed = robustCleanParse(raw);
            cleanEl.value = formatJson(parsed);
            toastr.success('Beautified after repairs');
        } catch (err) {
            toastr.error('Beautify failed');
            logDiag('Error:', err.message);
        }
    }
});

minifyBtn.addEventListener('click', () => {
    diagEl.textContent = '';
    const raw = uncleanEl.value.trim();
    if (!raw) return toastr.info('No input.');
    try {
        const p = JSON.parse(raw);
        cleanEl.value = minifyJson(p);
        toastr.success('Minified with native parse');
    } catch (e) {
        try {
            const parsed = robustCleanParse(raw);
            cleanEl.value = minifyJson(parsed);
            toastr.success('Minified after repairs');
        } catch (err) {
            toastr.error('Minify failed');
            logDiag('Error:', err.message);
        }
    }
});

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
    if (!cleanEl.value) return toastr.info('No output');
    try {
        await navigator.clipboard.writeText(cleanEl.value);
        toastr.success('Output copied');
    } catch (e) {
        toastr.error('Copy failed');
        logDiag('Copy error:', e);
    }
});

downloadBtn.addEventListener('click', () => {
    if (!cleanEl.value) return toastr.info('No output');
    downloadText('cleaned.json', cleanEl.value);
    toastr.success('Downloaded cleaned.json');
});

sampleBtn.addEventListener('click', () => {
    const sample = `["{\\\"NMLS\\\":2046912,\\\"Role\\\":2,\\\"Email\\\":\\\"zgannam@westcapitallending.com\\\",\\\"Phone\\\":\\\"(949) 404-5573\\\",\\\"UserId\\\":1636,\\\"IsActive\\\":1,\\\"JobTitle\\\":\\\"Branch .....................Manager\\\",\\\"LastName\\\":\\\"Gannam\\\",\\\"NickName\\\":null,\\\"TeamName\\\":\\\"\\\",\\\"FirstName\\\":\\\"Zoe\\\",\\\"Agent\\\":null}"]`;
    uncleanEl.value = sample;
    toastr.info('Sample inserted');
});

clearInputBtn.addEventListener('click', () => {
    uncleanEl.value = '';
    toastr.info('Input cleared');
});

logDiag('Tool ready.');
