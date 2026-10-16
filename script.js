/* ============================================================
 * JSON Cleaner & Formatter — Super Recover
 * Battle-tested, monkey-proof, whitespace-safe.
 * Full script — safe to replace entirely.
 * ============================================================ */

// ---------- Bootstrap ----------
document.getElementById('year').textContent = new Date().getFullYear();

toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  timeOut: 3500,
};

// ---------- DOM refs ----------
const uncleanEl = document.getElementById('uncleanJson');
const cleanEl = document.getElementById('cleanJson');
const diagEl = document.getElementById('diagnostics');
const parseBtn = document.getElementById('parseButton');
const beautifyBtn = document.getElementById('beautifyButton');
const minifyBtn = document.getElementById('minifyButton');
const repairOnlyBtn = document.getElementById('repairOnlyButton');
const copyInputBtn = document.getElementById('copyInput');
const copyOutputBtn = document.getElementById('copyOutput');
const downloadBtn = document.getElementById('downloadOutput');
const sampleBtn = document.getElementById('sampleBtn');
const clearInputBtn = document.getElementById('clearInput');
const loader = document.getElementById('loader');

// ============================================================
// Diagnostics
// ============================================================
function logDiag(...args) {
  const line = args.map((a) => (typeof a === 'string' ? a : safeStringify(a))).join(' ');
  const stamped = `[${new Date().toISOString()}] ${line}`;
  diagEl.textContent = stamped + '\n' + diagEl.textContent;
  console.log(stamped);
}

function safeStringify(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// ============================================================
// Utilities
// ============================================================
const MAX_INPUT = 5_000_000;

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isProbablyStringifiedJson(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

// ============================================================
// LAYERED CLEANING PIPELINE
// ============================================================
function stripBOM(s) {
  return s.replace(/^\uFEFF/, '').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '');
}

function stripControlChars(s) {
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

    if (ch === '{' || ch === '[') {
      stack.push(openers[ch]);
    } else if (ch === '}' || ch === ']') {
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
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
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
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inDouble = false;
      }
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
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
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
      const m = /^([A-Za-z_$][A-Za-z0-9_$@\-]*)\s*:/.exec(text.slice(i));
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

  if (Array.isArray(value)) {
    return value.map((v) => deepUnwrapStrings(v, depth + 1));
  }

  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      value[k] = deepUnwrapStrings(value[k], depth + 1);
    }
    return value;
  }

  return value;
}

function robustCleanParse(raw, options = {}) {
  const { maxPasses = 8, maxUnwrap = 5, silent = false } = options;

  if (typeof raw !== 'string') throw new Error('Input must be a string.');
  const s = raw.trim();
  if (s.length === 0) throw new Error('Empty input.');
  if (s.length > MAX_INPUT) throw new Error(`Input too large (>${MAX_INPUT} bytes).`);

  const trace = [];

  try {
    const parsed = JSON.parse(s);
    if (!silent) logDiag('Fast-path JSON.parse succeeded.');
    return deepUnwrapStrings(parsed);
  } catch (e) {
    trace.push(`fast-path: ${e.message}`);
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
        const parsed = JSON.parse(temp);
        if (!silent) logDiag(`Parse succeeded on pass ${pass} (unwrap ${unwrapCount}).`);
        return deepUnwrapStrings(parsed);
      } catch (e) {
        trace.push(`pass ${pass} unwrap ${unwrapCount}: ${e.message}`);

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

  try {
    let fallback = s;
    fallback = stripBOM(fallback);
    fallback = normalizeLineEndings(fallback);
    fallback = stripControlChars(fallback);
    fallback = extractFirstJsonLike(fallback);
    fallback = unescapeForwardSlash(fallback);
    fallback = collapseBackslashes(fallback);
    fallback = removeTrailingCommas(fallback);
    fallback = singleToDoubleQuotes(fallback);
    fallback = quoteUnquotedKeys(fallback);
    const parsed = JSON.parse(fallback);
    if (!silent) logDiag('Fallback parse succeeded.');
    return deepUnwrapStrings(parsed);
  } catch (e) {
    trace.push(`fallback: ${e.message}`);
  }

  if (!silent) logDiag('All repair attempts failed.', { trace });
  throw new Error(
    `Unable to parse JSON after all repair attempts. ${trace[trace.length - 1] || ''}`,
  );
}

// ============================================================
// HARDCORE RANDOM JSON GENERATOR
// ============================================================
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndF = (min, max, dec = 2) => +(Math.random() * (max - min) + min).toFixed(dec);
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const pickMany = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const maybe = (prob = 0.5) => Math.random() < prob;
const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
const isoDate = (daysBack = 365) => {
  const d = new Date(Date.now() - rnd(0, daysBack) * 86_400_000);
  return d.toISOString();
};
const isoDateShort = (daysBack = 365) => isoDate(daysBack).split('T')[0];

const FIRST_NAMES = [
  'Zoe',
  'Ava',
  'Mia',
  'Leo',
  'Noah',
  'Ivy',
  'Eli',
  'Aria',
  'Kai',
  'Luca',
  'Sofia',
  'Mason',
  'Ruby',
  'Ezra',
  'Nora',
  'Owen',
  'Layla',
  'Caleb',
];
const LAST_NAMES = [
  'Gannam',
  'Chen',
  'Patel',
  'Nguyen',
  'Khan',
  'Smith',
  'Garcia',
  'Brown',
  'Okafor',
  'Rossi',
  'Haddad',
  'Yamamoto',
  'Kowalski',
  'Silva',
];
const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Dubai',
  'London',
  'New York',
  'Tokyo',
  'Berlin',
  'Toronto',
  'Sydney',
  'São Paulo',
  'Mumbai',
];
const COUNTRIES = ['PK', 'US', 'GB', 'DE', 'JP', 'AE', 'CA', 'AU', 'BR', 'IN'];
const STREETS = ['Main St', 'Oak Ave', 'Park Rd', 'Elm St', 'Maple Dr', 'Baker St'];
const COMPANIES = [
  'West Capital Lending',
  'Nova Corp',
  'Acme Inc',
  'Blue Peak',
  'Vertex',
  'Quantum Labs',
  'Aurora Systems',
  'Bright Path',
];
const DOMAINS = ['example.com', 'acme.io', 'nova.co', 'lending.com', 'test.dev', 'demo.app'];
const TITLES = [
  'Branch Manager',
  'Senior Engineer',
  'Product Lead',
  'Analyst',
  'Director',
  'CTO',
  'Designer',
  'Data Scientist',
];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Support'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Toys'];
const BRANDS = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'LG', 'Dell', 'Bose'];
const TAGS = ['new', 'sale', 'featured', 'limited', 'premium', 'eco', 'bestseller'];
const LOREM = [
  'Lorem ipsum dolor sit amet',
  'Consectetur adipiscing elit',
  'Sed do eiusmod tempor incididunt',
  'Ut labore et dolore magna aliqua',
  'Ut enim ad minim veniam',
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'JPY', 'INR'];
const STATUSES = ['active', 'pending', 'shipped', 'delivered', 'cancelled', 'refunded'];

function genName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function genEmail() {
  const f = pick(FIRST_NAMES).toLowerCase();
  const l = pick(LAST_NAMES).toLowerCase();
  return `${f}.${l}${maybe(0.3) ? rnd(1, 99) : ''}@${pick(DOMAINS)}`;
}

function genPhone() {
  return `(${rnd(100, 999)}) ${rnd(100, 999)}-${rnd(1000, 9999)}`;
}

function genAddress() {
  return {
    line1: `${rnd(1, 9999)} ${pick(STREETS)}`,
    city: pick(CITIES),
    country: pick(COUNTRIES),
    postalCode: String(rnd(10000, 99999)),
    ...(maybe(0.4) ? { line2: `Apt ${rnd(1, 500)}` } : {}),
    ...(maybe(0.3) ? { state: pick(['CA', 'NY', 'TX', 'FL', 'IL']) } : {}),
  };
}

function genMoney() {
  return rndF(5, 5000, 2);
}

function genReview(depth) {
  return {
    id: uuid(),
    rating: rnd(1, 5),
    title: pick(LOREM),
    body: pick(LOREM) + '. ' + pick(LOREM) + '.',
    author: genName(),
    verified: maybe(0.7),
    createdAt: isoDate(180),
    ...(depth > 0 && maybe(0.3)
      ? { replies: Array.from({ length: rnd(1, 3) }, () => genReview(0)) }
      : {}),
  };
}

function genProduct(depth = 2) {
  const price = genMoney();
  const cost = +(price * rndF(0.4, 0.75, 2)).toFixed(2);
  return {
    id: uuid(),
    sku: `SKU-${rnd(10000, 99999)}`,
    name: `${pick(BRANDS)} ${pick(CATEGORIES)} Item ${rnd(1, 1000)}`,
    description: pick(LOREM),
    price,
    cost,
    currency: pick(CURRENCIES),
    category: pick(CATEGORIES),
    brand: pick(BRANDS),
    tags: pickMany(TAGS, rnd(0, 3)),
    inStock: maybe(0.8),
    stock: rnd(0, 500),
    ...(maybe(0.6)
      ? {
          images: Array.from({ length: rnd(1, 4) }, (_, i) => ({
            id: i + 1,
            url: `https://cdn.${pick(DOMAINS)}/img/${uuid()}.jpg`,
            alt: pick(LOREM),
          })),
        }
      : {}),
    ...(depth > 0 && maybe(0.7)
      ? { reviews: Array.from({ length: rnd(0, 4) }, () => genReview(1)) }
      : {}),
    ...(depth > 0 && maybe(0.4)
      ? {
          variants: Array.from({ length: rnd(1, 3) }, () => ({
            sku: `VAR-${rnd(1000, 9999)}`,
            color: pick(['red', 'blue', 'black', 'white', 'green']),
            size: pick(['S', 'M', 'L', 'XL']),
            priceDelta: rndF(-10, 20, 2),
          })),
        }
      : {}),
  };
}

function genShipment() {
  return {
    id: uuid(),
    carrier: pick(['UPS', 'FedEx', 'DHL', 'USPS']),
    trackingNumber: `${pick(['1Z', 'FDX', 'DHL'])}${rnd(100000, 999999)}`,
    status: pick(['label_created', 'in_transit', 'out_for_delivery', 'delivered']),
    shippedAt: isoDate(30),
    estimatedDelivery: isoDateShort(-10),
    events: Array.from({ length: rnd(1, 5) }, () => ({
      timestamp: isoDate(15),
      location: `${pick(CITIES)}, ${pick(COUNTRIES)}`,
      status: pick(['picked_up', 'in_transit', 'arrived', 'out_for_delivery']),
    })),
  };
}

function genOrderItem(depth = 1) {
  const qty = rnd(1, 5);
  const unitPrice = genMoney();
  return {
    id: uuid(),
    productId: uuid(),
    quantity: qty,
    unitPrice,
    discount: maybe(0.3) ? rndF(0, unitPrice * 0.3, 2) : 0,
    lineTotal: +(unitPrice * qty).toFixed(2),
    ...(depth > 0 && maybe(0.5) ? { product: genProduct(0) } : {}),
  };
}

function genOrder(depth = 2) {
  const items = Array.from({ length: rnd(1, 5) }, () => genOrderItem(depth > 0 ? 1 : 0));
  const subtotal = +items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2);
  const tax = +(subtotal * 0.08).toFixed(2);
  const shipping = maybe(0.5) ? rndF(0, 25, 2) : 0;
  return {
    id: uuid(),
    orderNumber: `ORD-${new Date().getFullYear()}-${rnd(1000, 9999)}`,
    customer: {
      id: uuid(),
      name: genName(),
      email: genEmail(),
      ...(maybe(0.6) ? { phone: genPhone() } : {}),
      ...(maybe(0.5) ? { address: genAddress() } : {}),
    },
    items,
    subtotal,
    tax,
    shipping,
    total: +(subtotal + tax + shipping).toFixed(2),
    currency: pick(CURRENCIES),
    status: pick(STATUSES),
    paymentMethod: pick(['card', 'paypal', 'apple_pay', 'bank_transfer', 'crypto']),
    createdAt: isoDate(180),
    ...(depth > 0 && maybe(0.6) ? { shipment: genShipment() } : {}),
    ...(depth > 0 && maybe(0.4) ? { notes: pick(LOREM) } : {}),
  };
}

function genUser(depth = 2) {
  return {
    id: uuid(),
    username: `${pick(FIRST_NAMES).toLowerCase()}${rnd(1, 999)}`,
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    email: genEmail(),
    phone: genPhone(),
    role: pick(['admin', 'manager', 'user', 'viewer']),
    isActive: maybe(0.8),
    profile: {
      avatar: `https://avatars.${pick(DOMAINS)}/${uuid()}`,
      bio: pick(LOREM),
      ...(maybe(0.6)
        ? {
            social: {
              twitter: `@${pick(FIRST_NAMES).toLowerCase()}${rnd(1, 99)}`,
              ...(maybe(0.5) ? { github: `${pick(FIRST_NAMES).toLowerCase()}${rnd(1, 999)}` } : {}),
            },
          }
        : {}),
    },
    address: genAddress(),
    ...(depth > 0 && maybe(0.7)
      ? { orders: Array.from({ length: rnd(0, 3) }, () => genOrder(1)) }
      : {}),
    ...(depth > 0 && maybe(0.5)
      ? {
          preferences: {
            language: pick(['en', 'es', 'fr', 'de', 'ur']),
            timezone: pick(['UTC', 'America/New_York', 'Asia/Karachi', 'Europe/London']),
            notifications: {
              email: maybe(0.9),
              sms: maybe(0.5),
              push: maybe(0.7),
            },
          },
        }
      : {}),
    createdAt: isoDate(730),
  };
}

function genInvoice(depth = 1) {
  const items = Array.from({ length: rnd(1, 4) }, () => ({
    description: pick(LOREM),
    quantity: rnd(1, 10),
    unitPrice: genMoney(),
    total: 0,
  }));
  items.forEach((it) => (it.total = +(it.quantity * it.unitPrice).toFixed(2)));
  const total = +items.reduce((s, i) => s + i.total, 0).toFixed(2);
  return {
    invoiceNumber: `INV-${new Date().getFullYear()}-${rnd(1000, 9999)}`,
    issuedAt: isoDateShort(90),
    dueAt: isoDateShort(-30),
    currency: pick(CURRENCIES),
    from: { company: pick(COMPANIES), address: genAddress(), taxId: `TAX-${rnd(100000, 999999)}` },
    to: { name: genName(), email: genEmail(), address: genAddress() },
    items,
    subtotal: total,
    tax: +(total * 0.1).toFixed(2),
    total: +(total * 1.1).toFixed(2),
    status: pick(['draft', 'sent', 'paid', 'overdue']),
    ...(depth > 0 && maybe(0.5)
      ? {
          payments: Array.from({ length: rnd(0, 3) }, () => ({
            id: uuid(),
            amount: genMoney(),
            method: pick(['card', 'bank_transfer', 'paypal']),
            paidAt: isoDate(90),
          })),
        }
      : {}),
  };
}

function genEvent(depth = 1) {
  return {
    id: uuid(),
    title: pick(LOREM),
    description: pick(LOREM),
    startsAt: isoDate(-30),
    endsAt: isoDate(-30),
    location: genAddress(),
    organizer: { name: genName(), email: genEmail(), ...(maybe(0.5) ? { phone: genPhone() } : {}) },
    ...(depth > 0 && maybe(0.8)
      ? {
          attendees: Array.from({ length: rnd(1, 6) }, () => ({
            id: uuid(),
            name: genName(),
            email: genEmail(),
            rsvp: pick(['yes', 'no', 'maybe', 'pending']),
            ...(maybe(0.3)
              ? { dietary: pick(['vegetarian', 'vegan', 'gluten_free', 'halal']) }
              : {}),
          })),
        }
      : {}),
    ...(depth > 0 && maybe(0.5)
      ? {
          sessions: Array.from({ length: rnd(1, 3) }, () => ({
            title: pick(LOREM),
            speaker: genName(),
            startTime: isoDate(-30),
            durationMinutes: rnd(30, 120),
          })),
        }
      : {}),
    tags: pickMany(TAGS, rnd(0, 3)),
    published: maybe(0.7),
  };
}

function genEmployee(depth = 1) {
  return {
    employeeId: `EMP-${rnd(1000, 9999)}`,
    name: genName(),
    email: genEmail(),
    phone: genPhone(),
    title: pick(TITLES),
    department: pick(DEPARTMENTS),
    salary: rnd(40_000, 200_000),
    hireDate: isoDateShort(2000),
    manager: maybe(0.7) ? { id: uuid(), name: genName() } : null,
    ...(depth > 0 && maybe(0.6)
      ? {
          directReports: Array.from({ length: rnd(0, 4) }, () => ({
            employeeId: `EMP-${rnd(1000, 9999)}`,
            name: genName(),
            title: pick(TITLES),
          })),
        }
      : {}),
    ...(depth > 0 && maybe(0.4)
      ? {
          skills: pickMany(
            ['JavaScript', 'Python', 'Go', 'Rust', 'SQL', 'Kubernetes', 'AWS', 'React'],
            rnd(1, 5),
          ),
        }
      : {}),
  };
}

function genAnalytics() {
  return {
    metric: pick(['pageviews', 'signups', 'revenue', 'sessions', 'conversions']),
    period: pick(['1d', '7d', '30d', '90d']),
    total: rnd(100, 1_000_000),
    change: rndF(-50, 200, 2),
    breakdown: Array.from({ length: rnd(3, 7) }, () => ({
      label: pick(CITIES),
      value: rnd(10, 10_000),
      share: rndF(0, 1, 4),
    })),
    timeline: Array.from({ length: rnd(7, 30) }, (_, i) => ({
      date: isoDateShort(30 - i),
      value: rnd(50, 5000),
    })),
  };
}

function genGeoFeature() {
  return {
    type: 'Feature',
    id: uuid(),
    geometry: { type: 'Point', coordinates: [rndF(-180, 180, 6), rndF(-90, 90, 6)] },
    properties: {
      name: pick(CITIES),
      country: pick(COUNTRIES),
      population: rnd(10_000, 20_000_000),
      ...(maybe(0.4) ? { timezone: pick(['UTC', 'Asia/Karachi', 'America/New_York']) } : {}),
    },
  };
}

function genGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: Array.from({ length: rnd(2, 5) }, genGeoFeature),
  };
}

function genConfig() {
  return {
    appName: pick(COMPANIES),
    version: `${rnd(1, 9)}.${rnd(0, 20)}.${rnd(0, 50)}`,
    environment: pick(['dev', 'staging', 'prod']),
    features: Object.fromEntries(
      pickMany(['auth', 'payments', 'chat', 'search', 'analytics', 'notifications'], rnd(2, 5)).map(
        (f) => [f, maybe(0.8)],
      ),
    ),
    database: {
      host: `db.${pick(DOMAINS)}`,
      port: pick([5432, 3306, 27017]),
      ssl: maybe(0.9),
      pool: { min: rnd(1, 5), max: rnd(10, 50) },
    },
    ...(maybe(0.6)
      ? {
          logging: {
            level: pick(['debug', 'info', 'warn', 'error']),
            outputs: pickMany(['stdout', 'file', 'syslog'], rnd(1, 3)),
          },
        }
      : {}),
    ...(maybe(0.4)
      ? {
          integrations: Array.from({ length: rnd(1, 4) }, () => ({
            name: pick(['stripe', 'twilio', 'sendgrid', 'slack', 'github']),
            enabled: maybe(0.8),
            apiKey: `sk_${uuid().replace(/-/g, '')}`,
          })),
        }
      : {}),
  };
}

function genBlogPost(depth = 1) {
  return {
    id: uuid(),
    slug: pick(LOREM)
      .toLowerCase()
      .replace(/[^a-z]+/g, '-'),
    title: pick(LOREM),
    excerpt: pick(LOREM),
    body: `${pick(LOREM)}. ${pick(LOREM)}. ${pick(LOREM)}.`,
    author: { id: uuid(), name: genName(), avatar: `https://avatars.${pick(DOMAINS)}/${uuid()}` },
    tags: pickMany(TAGS, rnd(1, 4)),
    published: maybe(0.8),
    publishedAt: isoDate(365),
    stats: { views: rnd(0, 50_000), likes: rnd(0, 2000), comments: rnd(0, 200) },
    ...(depth > 0 && maybe(0.7)
      ? {
          comments: Array.from({ length: rnd(0, 5) }, () => ({
            id: uuid(),
            author: genName(),
            body: pick(LOREM),
            createdAt: isoDate(90),
            ...(maybe(0.4)
              ? {
                  replies: Array.from({ length: rnd(0, 3) }, () => ({
                    author: genName(),
                    body: pick(LOREM),
                    createdAt: isoDate(60),
                  })),
                }
              : {}),
          })),
        }
      : {}),
  };
}

const ARCHETYPES = [
  { name: 'user', gen: () => genUser(2) },
  { name: 'users', gen: () => Array.from({ length: rnd(2, 5) }, () => genUser(1)) },
  { name: 'order', gen: () => genOrder(2) },
  { name: 'orders', gen: () => Array.from({ length: rnd(2, 4) }, () => genOrder(1)) },
  { name: 'product', gen: () => genProduct(2) },
  { name: 'products', gen: () => Array.from({ length: rnd(3, 6) }, () => genProduct(1)) },
  { name: 'invoice', gen: () => genInvoice(1) },
  { name: 'event', gen: () => genEvent(1) },
  { name: 'employees', gen: () => Array.from({ length: rnd(3, 8) }, () => genEmployee(1)) },
  { name: 'analytics', gen: () => genAnalytics() },
  { name: 'geojson', gen: () => genGeoJSON() },
  { name: 'config', gen: () => genConfig() },
  { name: 'blogPost', gen: () => genBlogPost(1) },
  {
    name: 'mixedBundle',
    gen: () => ({
      user: genUser(1),
      recentOrders: Array.from({ length: rnd(1, 3) }, () => genOrder(1)),
      recommended: Array.from({ length: rnd(2, 4) }, () => genProduct(0)),
      config: genConfig(),
    }),
  },
];

let __lastArchetypeIndex = -1;

function pickArchetype() {
  if (ARCHETYPES.length === 1) return ARCHETYPES[0];
  let idx;
  do {
    idx = rnd(0, ARCHETYPES.length - 1);
  } while (idx === __lastArchetypeIndex);
  __lastArchetypeIndex = idx;
  return ARCHETYPES[idx];
}

const BROKEN_VARIANTS = [
  (json) => JSON.stringify(JSON.stringify(json)),
  (json) => {
    const p = JSON.stringify(json, null, 2);
    return p.replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, "'$1':").replace(/: "([^"]*)"/g, ": '$1'");
  },
  (json) => {
    const p = JSON.stringify(json, null, 2);
    return p.replace(/([}\]"])(\n\s*[}\]])/g, '$1,$2').replace(/,\s*\n(\s*})/g, ',\n$1');
  },
  (json) =>
    `Here is the data you asked for:\n\n${JSON.stringify(json, null, 2)}\n\n— End of response —`,
  (json) => JSON.stringify(JSON.stringify(json)).replace(/\\\\"/g, '\\\\\\\\"'),
  (json) => {
    const p = JSON.stringify(json, null, 2)
      .replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:')
      .replace(/: "([^"]*)"/g, ": '$1'");
    return p.replace(/}(\s*\n\s*[}\]])/g, '},$1');
  },
  (json) => JSON.stringify({ payload: JSON.stringify(json), meta: { ok: true } }),
  (json) => JSON.stringify(json, null, 2),
];

let __lastVariantIndex = -1;

function pickVariant() {
  let idx;
  do {
    idx = Math.random() < 0.85 ? rnd(0, 6) : 7;
  } while (idx === __lastVariantIndex);
  __lastVariantIndex = idx;
  return BROKEN_VARIANTS[idx];
}

function randomSample() {
  const archetype = pickArchetype();
  const payload = archetype.gen();
  const broken = pickVariant()(payload);
  console.debug(`[sample] archetype=${archetype.name} variant=${__lastVariantIndex}`);
  return broken;
}

// ============================================================
// UI HELPERS
// ============================================================
function showLoader() {
  loader.classList.remove('hidden');
  loader.classList.add('flex');
  [parseBtn, beautifyBtn, minifyBtn, repairOnlyBtn].forEach((b) => (b.disabled = true));
}

function hideLoader() {
  loader.classList.add('hidden');
  loader.classList.remove('flex');
  [parseBtn, beautifyBtn, minifyBtn, repairOnlyBtn].forEach((b) => (b.disabled = false));
}

function formatJson(value, space = 2) {
  return JSON.stringify(value, null, space);
}

function minifyJson(value) {
  return JSON.stringify(value);
}

function assertRoundTrip(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// EVENT HANDLERS
// ============================================================
parseBtn.addEventListener('click', async () => {
  diagEl.textContent = '';
  cleanEl.value = '';
  const raw = uncleanEl.value.trim();
  if (!raw) return toastr.info('Paste JSON first.');

  showLoader();
  const start = performance.now();
  try {
    const parsed = robustCleanParse(raw);
    const formatted = formatJson(parsed);
    if (!assertRoundTrip(formatted)) throw new Error('Output failed round-trip validation.');
    cleanEl.value = formatted;
    const t = ((performance.now() - start) / 1000).toFixed(3);
    toastr.success(`Cleaned & formatted in ${t}s ✅`);
    logDiag('Output length:', formatted.length, 'chars');
  } catch (err) {
    toastr.error(`Parse failed: ${err.message}`);
    logDiag('Error:', err.message);
  } finally {
    hideLoader();
  }
});

beautifyBtn.addEventListener('click', async () => {
  diagEl.textContent = '';
  const raw = uncleanEl.value.trim();
  if (!raw) return toastr.info('No input.');

  showLoader();
  const start = performance.now();
  try {
    const parsed = robustCleanParse(raw);
    const formatted = formatJson(parsed);
    if (!assertRoundTrip(formatted)) throw new Error('Output failed round-trip validation.');
    cleanEl.value = formatted;
    const t = ((performance.now() - start) / 1000).toFixed(3);
    toastr.success(`Beautified in ${t}s`);
  } catch (err) {
    toastr.error(`Beautify failed: ${err.message}`);
    logDiag('Error:', err.message);
  } finally {
    hideLoader();
  }
});

minifyBtn.addEventListener('click', async () => {
  diagEl.textContent = '';
  const raw = uncleanEl.value.trim();
  if (!raw) return toastr.info('No input.');

  showLoader();
  const start = performance.now();
  try {
    const parsed = robustCleanParse(raw);
    const minified = minifyJson(parsed);
    if (!assertRoundTrip(minified))
      throw new Error('Minified output failed round-trip validation.');
    cleanEl.value = minified;
    const t = ((performance.now() - start) / 1000).toFixed(3);
    toastr.success(`Minified in ${t}s`);
  } catch (err) {
    toastr.error(`Minify failed: ${err.message}`);
    logDiag('Error:', err.message);
  } finally {
    hideLoader();
  }
});

repairOnlyBtn.addEventListener('click', async () => {
  diagEl.textContent = '';
  const raw = uncleanEl.value.trim();
  if (!raw) return toastr.info('No input.');

  showLoader();
  const start = performance.now();
  try {
    const parsed = robustCleanParse(raw);
    const compact = JSON.stringify(parsed);
    if (!assertRoundTrip(compact)) throw new Error('Repaired output failed round-trip validation.');
    cleanEl.value = compact;
    const t = ((performance.now() - start) / 1000).toFixed(3);
    toastr.success(`Repaired in ${t}s`);
  } catch (err) {
    toastr.error(`Repair failed: ${err.message}`);
    logDiag('Error:', err.message);
  } finally {
    hideLoader();
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

// ---------- SAMPLE BUTTON ----------
sampleBtn.addEventListener('click', () => {
  try {
    const sample = randomSample();
    uncleanEl.value = sample;
    cleanEl.value = '';
    diagEl.textContent = '';
    toastr.info('Random sample inserted');
  } catch (err) {
    console.error('[sample] failed:', err);
    toastr.error('Sample generation failed — see console');
  }
});

clearInputBtn.addEventListener('click', () => {
  uncleanEl.value = '';
  cleanEl.value = '';
  diagEl.textContent = '';
  toastr.info('Cleared');
});

// Expose for console testing / monkey testing
window.__jsonTool = {
  robustCleanParse,
  randomSample,
  deepUnwrapStrings,
};

logDiag('Tool ready. Use window.__jsonTool for console testing.');
