/* ============================================================
 * HARDCORE RANDOM JSON GENERATOR
 * -----------------------------------------
 * - 12+ archetypes, each with nested child relations
 * - Recursive depth control
 * - Random field presence (sparse payloads)
 * - 8 different "broken" variants
 * - Never repeats the same archetype twice in a row
 * ============================================================ */

// ---------- Low-level random helpers ----------
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

// ---------- Realistic data pools ----------
const FIRST_NAMES = ['Zoe', 'Ava', 'Mia', 'Leo', 'Noah', 'Ivy', 'Eli', 'Aria', 'Kai', 'Luca',
  'Sofia', 'Mason', 'Ruby', 'Ezra', 'Nora', 'Owen', 'Layla', 'Caleb'];
const LAST_NAMES = ['Gannam', 'Chen', 'Patel', 'Nguyen', 'Khan', 'Smith', 'Garcia', 'Brown',
  'Okafor', 'Rossi', 'Haddad', 'Yamamoto', 'Kowalski', 'Silva'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Dubai', 'London', 'New York',
  'Tokyo', 'Berlin', 'Toronto', 'Sydney', 'São Paulo', 'Mumbai'];
const COUNTRIES = ['PK', 'US', 'GB', 'DE', 'JP', 'AE', 'CA', 'AU', 'BR', 'IN'];
const STREETS = ['Main St', 'Oak Ave', 'Park Rd', 'Elm St', 'Maple Dr', 'Baker St'];
const COMPANIES = ['West Capital Lending', 'Nova Corp', 'Acme Inc', 'Blue Peak', 'Vertex',
  'Quantum Labs', 'Aurora Systems', 'Bright Path'];
const DOMAINS = ['example.com', 'acme.io', 'nova.co', 'lending.com', 'test.dev', 'demo.app'];
const TITLES = ['Branch Manager', 'Senior Engineer', 'Product Lead', 'Analyst',
  'Director', 'CTO', 'Designer', 'Data Scientist'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Support'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Toys'];
const BRANDS = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'LG', 'Dell', 'Bose'];
const TAGS = ['new', 'sale', 'featured', 'limited', 'premium', 'eco', 'bestseller'];
const LOREM = ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit',
  'Sed do eiusmod tempor incididunt', 'Ut labore et dolore magna aliqua',
  'Ut enim ad minim veniam'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'JPY', 'INR'];
const STATUSES = ['active', 'pending', 'shipped', 'delivered', 'cancelled', 'refunded'];

// ---------- Reusable leaf generators ----------
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
    ...(maybe(0.4) ? {line2: `Apt ${rnd(1, 500)}`} : {}),
    ...(maybe(0.3) ? {state: pick(['CA', 'NY', 'TX', 'FL', 'IL'])} : {}),
  };
}

function genMoney() {
  return rndF(5, 5000, 2);
}

// ---------- Nested entity generators ----------
function genReview(depth) {
  return {
    id: uuid(),
    rating: rnd(1, 5),
    title: pick(LOREM),
    body: pick(LOREM) + '. ' + pick(LOREM) + '.',
    author: genName(),
    verified: maybe(0.7),
    createdAt: isoDate(180),
    ...(depth > 0 && maybe(0.3) ? {replies: Array.from({length: rnd(1, 3)}, () => genReview(0))} : {}),
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
    ...(maybe(0.6) ? {
      images: Array.from({length: rnd(1, 4)}, (_, i) => ({
        id: i + 1,
        url: `https://cdn.${pick(DOMAINS)}/img/${uuid()}.jpg`,
        alt: pick(LOREM),
      }))
    } : {}),
    ...(depth > 0 && maybe(0.7) ? {reviews: Array.from({length: rnd(0, 4)}, () => genReview(1))} : {}),
    ...(depth > 0 && maybe(0.4) ? {
      variants: Array.from({length: rnd(1, 3)}, () => ({
        sku: `VAR-${rnd(1000, 9999)}`,
        color: pick(['red', 'blue', 'black', 'white', 'green']),
        size: pick(['S', 'M', 'L', 'XL']),
        priceDelta: rndF(-10, 20, 2),
      }))
    } : {}),
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
    events: Array.from({length: rnd(1, 5)}, () => ({
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
    ...(depth > 0 && maybe(0.5) ? {product: genProduct(0)} : {}),
  };
}

function genOrder(depth = 2) {
  const items = Array.from({length: rnd(1, 5)}, () => genOrderItem(depth > 0 ? 1 : 0));
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
      ...(maybe(0.6) ? {phone: genPhone()} : {}),
      ...(maybe(0.5) ? {address: genAddress()} : {}),
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
    ...(depth > 0 && maybe(0.6) ? {shipment: genShipment()} : {}),
    ...(depth > 0 && maybe(0.4) ? {notes: pick(LOREM)} : {}),
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
      ...(maybe(0.6) ? {
        social: {
          twitter: `@${pick(FIRST_NAMES).toLowerCase()}${rnd(1, 99)}`,
          ...(maybe(0.5) ? {github: `${pick(FIRST_NAMES).toLowerCase()}${rnd(1, 999)}`} : {}),
        }
      } : {}),
    },
    address: genAddress(),
    ...(depth > 0 && maybe(0.7) ? {orders: Array.from({length: rnd(0, 3)}, () => genOrder(1))} : {}),
    ...(depth > 0 && maybe(0.5) ? {
      preferences: {
        language: pick(['en', 'es', 'fr', 'de', 'ur']),
        timezone: pick(['UTC', 'America/New_York', 'Asia/Karachi', 'Europe/London']),
        notifications: {
          email: maybe(0.9),
          sms: maybe(0.5),
          push: maybe(0.7),
        },
      }
    } : {}),
    createdAt: isoDate(730),
  };
}

function genInvoice(depth = 1) {
  const items = Array.from({length: rnd(1, 4)}, () => ({
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
    from: {
      company: pick(COMPANIES),
      address: genAddress(),
      taxId: `TAX-${rnd(100000, 999999)}`,
    },
    to: {
      name: genName(),
      email: genEmail(),
      address: genAddress(),
    },
    items,
    subtotal: total,
    tax: +(total * 0.1).toFixed(2),
    total: +(total * 1.1).toFixed(2),
    status: pick(['draft', 'sent', 'paid', 'overdue']),
    ...(depth > 0 && maybe(0.5) ? {
      payments: Array.from({length: rnd(0, 3)}, () => ({
        id: uuid(),
        amount: genMoney(),
        method: pick(['card', 'bank_transfer', 'paypal']),
        paidAt: isoDate(90),
      }))
    } : {}),
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
    organizer: {
      name: genName(),
      email: genEmail(),
      ...(maybe(0.5) ? {phone: genPhone()} : {}),
    },
    ...(depth > 0 && maybe(0.8) ? {
      attendees: Array.from({length: rnd(1, 6)}, () => ({
        id: uuid(),
        name: genName(),
        email: genEmail(),
        rsvp: pick(['yes', 'no', 'maybe', 'pending']),
        ...(maybe(0.3) ? {dietary: pick(['vegetarian', 'vegan', 'gluten_free', 'halal'])} : {}),
      }))
    } : {}),
    ...(depth > 0 && maybe(0.5) ? {
      sessions: Array.from({length: rnd(1, 3)}, () => ({
        title: pick(LOREM),
        speaker: genName(),
        startTime: isoDate(-30),
        durationMinutes: rnd(30, 120),
      }))
    } : {}),
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
    manager: maybe(0.7) ? {id: uuid(), name: genName()} : null,
    ...(depth > 0 && maybe(0.6) ? {
      directReports: Array.from({length: rnd(0, 4)}, () => ({
        employeeId: `EMP-${rnd(1000, 9999)}`,
        name: genName(),
        title: pick(TITLES),
      }))
    } : {}),
    ...(depth > 0 && maybe(0.4) ? {
      skills: pickMany(
        ['JavaScript', 'Python', 'Go', 'Rust', 'SQL', 'Kubernetes', 'AWS', 'React'],
        rnd(1, 5),
      )
    } : {}),
  };
}

function genAnalytics() {
  return {
    metric: pick(['pageviews', 'signups', 'revenue', 'sessions', 'conversions']),
    period: pick(['1d', '7d', '30d', '90d']),
    total: rnd(100, 1_000_000),
    change: rndF(-50, 200, 2),
    breakdown: Array.from({length: rnd(3, 7)}, () => ({
      label: pick(CITIES),
      value: rnd(10, 10_000),
      share: rndF(0, 1, 4),
    })),
    timeline: Array.from({length: rnd(7, 30)}, (_, i) => ({
      date: isoDateShort(30 - i),
      value: rnd(50, 5000),
    })),
  };
}

function genGeoFeature() {
  return {
    type: 'Feature',
    id: uuid(),
    geometry: {
      type: 'Point',
      coordinates: [rndF(-180, 180, 6), rndF(-90, 90, 6)],
    },
    properties: {
      name: pick(CITIES),
      country: pick(COUNTRIES),
      population: rnd(10_000, 20_000_000),
      ...(maybe(0.4) ? {timezone: pick(['UTC', 'Asia/Karachi', 'America/New_York'])} : {}),
    },
  };
}

function genGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: Array.from({length: rnd(2, 5)}, genGeoFeature),
  };
}

function genConfig() {
  return {
    appName: pick(COMPANIES),
    version: `${rnd(1, 9)}.${rnd(0, 20)}.${rnd(0, 50)}`,
    environment: pick(['dev', 'staging', 'prod']),
    features: Object.fromEntries(
      pickMany(['auth', 'payments', 'chat', 'search', 'analytics', 'notifications'], rnd(2, 5))
        .map((f) => [f, maybe(0.8)]),
    ),
    database: {
      host: `db.${pick(DOMAINS)}`,
      port: pick([5432, 3306, 27017]),
      ssl: maybe(0.9),
      pool: {min: rnd(1, 5), max: rnd(10, 50)},
    },
    ...(maybe(0.6) ? {
      logging: {
        level: pick(['debug', 'info', 'warn', 'error']),
        outputs: pickMany(['stdout', 'file', 'syslog'], rnd(1, 3)),
      }
    } : {}),
    ...(maybe(0.4) ? {
      integrations: Array.from({length: rnd(1, 4)}, () => ({
        name: pick(['stripe', 'twilio', 'sendgrid', 'slack', 'github']),
        enabled: maybe(0.8),
        apiKey: `sk_${uuid().replace(/-/g, '')}`,
      }))
    } : {}),
  };
}

function genBlogPost(depth = 1) {
  return {
    id: uuid(),
    slug: pick(LOREM).toLowerCase().replace(/[^a-z]+/g, '-'),
    title: pick(LOREM),
    excerpt: pick(LOREM),
    body: `${pick(LOREM)}. ${pick(LOREM)}. ${pick(LOREM)}.`,
    author: {
      id: uuid(),
      name: genName(),
      avatar: `https://avatars.${pick(DOMAINS)}/${uuid()}`,
    },
    tags: pickMany(TAGS, rnd(1, 4)),
    published: maybe(0.8),
    publishedAt: isoDate(365),
    stats: {
      views: rnd(0, 50_000),
      likes: rnd(0, 2000),
      comments: rnd(0, 200),
    },
    ...(depth > 0 && maybe(0.7) ? {
      comments: Array.from({length: rnd(0, 5)}, () => ({
        id: uuid(),
        author: genName(),
        body: pick(LOREM),
        createdAt: isoDate(90),
        ...(maybe(0.4) ? {
          replies: Array.from({length: rnd(0, 3)}, () => ({
            author: genName(),
            body: pick(LOREM),
            createdAt: isoDate(60),
          }))
        } : {}),
      }))
    } : {}),
  };
}

// ---------- Archetype registry ----------
const ARCHETYPES = [
  {name: 'user', gen: () => genUser(2)},
  {name: 'users', gen: () => Array.from({length: rnd(2, 5)}, () => genUser(1))},
  {name: 'order', gen: () => genOrder(2)},
  {name: 'orders', gen: () => Array.from({length: rnd(2, 4)}, () => genOrder(1))},
  {name: 'product', gen: () => genProduct(2)},
  {name: 'products', gen: () => Array.from({length: rnd(3, 6)}, () => genProduct(1))},
  {name: 'invoice', gen: () => genInvoice(1)},
  {name: 'event', gen: () => genEvent(1)},
  {name: 'employees', gen: () => Array.from({length: rnd(3, 8)}, () => genEmployee(1))},
  {name: 'analytics', gen: () => genAnalytics()},
  {name: 'geojson', gen: () => genGeoJSON()},
  {name: 'config', gen: () => genConfig()},
  {name: 'blogPost', gen: () => genBlogPost(1)},
  {
    name: 'mixedBundle', gen: () => ({
      user: genUser(1),
      recentOrders: Array.from({length: rnd(1, 3)}, () => genOrder(1)),
      recommended: Array.from({length: rnd(2, 4)}, () => genProduct(0)),
      config: genConfig(),
    })
  },
];

// ---------- Track last archetype to avoid repeats ----------
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

// ---------- Broken variants ----------
const BROKEN_VARIANTS = [
  // 0: stringified JSON (double-encoded)
  (json) => JSON.stringify(JSON.stringify(json)),

  // 1: single-quoted keys + values
  (json) => {
    const p = JSON.stringify(json, null, 2);
    return p
      .replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, "'$1':")
      .replace(/: "([^"]*)"/g, ": '$1'");
  },

  // 2: trailing commas sprinkled
  (json) => {
    const p = JSON.stringify(json, null, 2);
    return p
      .replace(/([}\]"])(\n\s*[}\]])/g, '$1,$2')
      .replace(/,\s*\n(\s*})/g, ',\n$1');
  },

  // 3: wrapped in prose
  (json) => `Here is the data you asked for:\n\n${JSON.stringify(json, null, 2)}\n\n— End of response —`,

  // 4: double-escaped (backslashes everywhere)
  (json) => JSON.stringify(JSON.stringify(json)).replace(/\\\\"/g, '\\\\\\\\"'),

  // 5: unquoted keys + single quotes + trailing comma
  (json) => {
    const p = JSON.stringify(json, null, 2)
      .replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:')
      .replace(/: "([^"]*)"/g, ": '$1'");
    return p.replace(/}(\s*\n\s*[}\]])/g, '},$1');
  },

  // 6: JSON wrapped inside a JSON string field
  (json) => JSON.stringify({payload: JSON.stringify(json), meta: {ok: true}}),

  // 7: clean, already valid (control case)
  (json) => JSON.stringify(json, null, 2),
];

let __lastVariantIndex = -1;

function pickVariant() {
  // Occasionally return clean (variant 7) but never twice in a row
  let idx;
  do {
    // Bias toward broken variants (7 out of 8 are broken)
    idx = Math.random() < 0.85 ? rnd(0, 6) : 7;
  } while (idx === __lastVariantIndex);
  __lastVariantIndex = idx;
  return BROKEN_VARIANTS[idx];
}

// ---------- Public API ----------
function randomSample() {
  const archetype = pickArchetype();
  const payload = archetype.gen();
  const broken = pickVariant()(payload);
  // Log what was generated (helps you see variety while testing)
  console.debug(`[sample] archetype=${archetype.name} variant=${__lastVariantIndex}`);
  return broken;
}