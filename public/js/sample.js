/* ============================================================
 * sample.js — Hardcore random JSON generator (ES module)
 * ============================================================ */

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

const FIRST_NAMES = ['Zoe', 'Ava', 'Mia', 'Leo', 'Noah', 'Ivy', 'Eli', 'Aria', 'Kai', 'Luca'];
const LAST_NAMES = ['Gannam', 'Chen', 'Patel', 'Nguyen', 'Khan', 'Smith', 'Garcia', 'Brown'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Dubai', 'London', 'New York', 'Tokyo', 'Berlin'];
const COUNTRIES = ['PK', 'US', 'GB', 'DE', 'JP', 'AE', 'CA', 'AU'];
const STREETS = ['Main St', 'Oak Ave', 'Park Rd', 'Elm St', 'Maple Dr'];
const COMPANIES = ['West Capital Lending', 'Nova Corp', 'Acme Inc', 'Blue Peak', 'Vertex'];
const DOMAINS = ['example.com', 'acme.io', 'nova.co', 'lending.com', 'test.dev'];
const TITLES = ['Branch Manager', 'Senior Engineer', 'Product Lead', 'Analyst', 'CTO'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
const BRANDS = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'LG'];
const TAGS = ['new', 'sale', 'featured', 'limited', 'premium'];
const LOREM = [
  'Lorem ipsum dolor sit amet',
  'Consectetur adipiscing elit',
  'Sed do eiusmod tempor incididunt',
  'Ut labore et dolore magna aliqua',
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'JPY'];
const STATUSES = ['active', 'pending', 'shipped', 'delivered', 'cancelled'];

const genName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const genEmail = () => {
  const f = pick(FIRST_NAMES).toLowerCase();
  const l = pick(LAST_NAMES).toLowerCase();
  return `${f}.${l}${maybe(0.3) ? rnd(1, 99) : ''}@${pick(DOMAINS)}`;
};
const genPhone = () => `(${rnd(100, 999)}) ${rnd(100, 999)}-${rnd(1000, 9999)}`;
const genMoney = () => rndF(5, 5000, 2);
const genAddress = () => ({
  line1: `${rnd(1, 9999)} ${pick(STREETS)}`,
  city: pick(CITIES),
  country: pick(COUNTRIES),
  postalCode: String(rnd(10000, 99999)),
});

function genReview(depth) {
  return {
    id: uuid(),
    rating: rnd(1, 5),
    title: pick(LOREM),
    body: pick(LOREM),
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

function genOrder(depth = 2) {
  const items = Array.from({ length: rnd(1, 5) }, () => {
    const qty = rnd(1, 5);
    const unitPrice = genMoney();
    return {
      id: uuid(),
      productId: uuid(),
      quantity: qty,
      unitPrice,
      discount: maybe(0.3) ? rndF(0, unitPrice * 0.3, 2) : 0,
      lineTotal: +(unitPrice * qty).toFixed(2),
      ...(depth > 1 && maybe(0.5) ? { product: genProduct(0) } : {}),
    };
  });
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
    profile: { avatar: `https://avatars.${pick(DOMAINS)}/${uuid()}`, bio: pick(LOREM) },
    address: genAddress(),
    ...(depth > 0 && maybe(0.7)
      ? { orders: Array.from({ length: rnd(0, 3) }, () => genOrder(1)) }
      : {}),
    createdAt: isoDate(730),
  };
}

function genInvoice(depth = 1) {
  const items = Array.from({ length: rnd(1, 4) }, () => {
    const quantity = rnd(1, 10);
    const unitPrice = genMoney();
    return {
      description: pick(LOREM),
      quantity,
      unitPrice,
      total: +(quantity * unitPrice).toFixed(2),
    };
  });
  const total = +items.reduce((s, i) => s + i.total, 0).toFixed(2);
  return {
    invoiceNumber: `INV-${new Date().getFullYear()}-${rnd(1000, 9999)}`,
    issuedAt: isoDateShort(90),
    dueAt: isoDateShort(-30),
    currency: pick(CURRENCIES),
    from: { company: pick(COMPANIES), address: genAddress() },
    to: { name: genName(), email: genEmail() },
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
    organizer: { name: genName(), email: genEmail() },
    ...(depth > 0 && maybe(0.8)
      ? {
          attendees: Array.from({ length: rnd(1, 6) }, () => ({
            id: uuid(),
            name: genName(),
            email: genEmail(),
            rsvp: pick(['yes', 'no', 'maybe']),
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
    ...(depth > 0 && maybe(0.6)
      ? {
          directReports: Array.from({ length: rnd(0, 4) }, () => ({
            employeeId: `EMP-${rnd(1000, 9999)}`,
            name: genName(),
            title: pick(TITLES),
          })),
        }
      : {}),
  };
}

function genAnalytics() {
  return {
    metric: pick(['pageviews', 'signups', 'revenue', 'sessions']),
    period: pick(['1d', '7d', '30d', '90d']),
    total: rnd(100, 1_000_000),
    change: rndF(-50, 200, 2),
    breakdown: Array.from({ length: rnd(3, 7) }, () => ({
      label: pick(CITIES),
      value: rnd(10, 10_000),
    })),
    timeline: Array.from({ length: rnd(7, 30) }, (_, i) => ({
      date: isoDateShort(30 - i),
      value: rnd(50, 5000),
    })),
  };
}

function genConfig() {
  return {
    appName: pick(COMPANIES),
    version: `${rnd(1, 9)}.${rnd(0, 20)}.${rnd(0, 50)}`,
    environment: pick(['dev', 'staging', 'prod']),
    features: Object.fromEntries(
      pickMany(['auth', 'payments', 'chat', 'search', 'analytics'], rnd(2, 5)).map((f) => [
        f,
        maybe(0.8),
      ]),
    ),
    database: { host: `db.${pick(DOMAINS)}`, port: pick([5432, 3306, 27017]), ssl: maybe(0.9) },
  };
}

function genBlogPost(depth = 1) {
  return {
    id: uuid(),
    slug: pick(LOREM)
      .toLowerCase()
      .replace(/[^a-z]+/g, '-'),
    title: pick(LOREM),
    body: `${pick(LOREM)}. ${pick(LOREM)}.`,
    author: { name: genName(), avatar: `https://avatars.${pick(DOMAINS)}/${uuid()}` },
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
  { name: 'config', gen: () => genConfig() },
  { name: 'blogPost', gen: () => genBlogPost(1) },
];

let __lastArchetypeIndex = -1;

function pickArchetype() {
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
    return p.replace(/([}\]"])(\n\s*[}\]])/g, '$1,$2');
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

export function randomSample() {
  const archetype = pickArchetype();
  const payload = archetype.gen();
  const broken = pickVariant()(payload);
  console.debug(`[sample] archetype=${archetype.name} variant=${__lastVariantIndex}`);
  return broken;
}
