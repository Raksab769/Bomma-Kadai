const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static admin UI if present
app.use('/', express.static(path.join(__dirname, 'public')));

async function readJSON(file, fallback) {
  try {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return fallback;
  }
}

async function writeJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

// Auth middleware for protected routes
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'Missing token' });
  const token = m[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Products
app.get('/api/products', async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE, []);
  res.json(products);
});

app.post('/api/products', requireAuth, async (req, res) => {
  const { name, price, emoji } = req.body || {};
  if (!name || typeof price !== 'number') return res.status(400).json({ error: 'Invalid payload' });
  const products = await readJSON(PRODUCTS_FILE, []);
  const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
  const newProd = { id: maxId + 1, name, price, emoji: emoji || '🎁' };
  products.push(newProd);
  await writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(newProd);
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, price, emoji } = req.body || {};
  const products = await readJSON(PRODUCTS_FILE, []);
  const p = products.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (name) p.name = name;
  if (typeof price === 'number') p.price = price;
  if (emoji) p.emoji = emoji;
  await writeJSON(PRODUCTS_FILE, products);
  res.json(p);
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  let products = await readJSON(PRODUCTS_FILE, []);
  const before = products.length;
  products = products.filter(x => x.id !== id);
  if (products.length === before) return res.status(404).json({ error: 'Not found' });
  await writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true });
});

// Orders
app.get('/api/orders', async (req, res) => {
  const orders = await readJSON(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { items, total } = req.body || {};
  if (!Array.isArray(items) || typeof total !== 'number') return res.status(400).json({ error: 'Invalid payload' });
  const orders = await readJSON(ORDERS_FILE, []);
  const order = {
    id: 'ORD-' + Date.now(),
    items,
    total,
    createdAt: new Date().toISOString(),
    status: 'Pending'
  };
  orders.push(order);
  await writeJSON(ORDERS_FILE, orders);
  res.status(201).json(order);
});

app.put('/api/orders/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  const orders = await readJSON(ORDERS_FILE, []);
  const o = orders.find(x => x.id === id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (status) o.status = status;
  await writeJSON(ORDERS_FILE, orders);
  res.json(o);
});

app.delete('/api/orders/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  let orders = await readJSON(ORDERS_FILE, []);
  const before = orders.length;
  orders = orders.filter(x => x.id !== id);
  if (orders.length === before) return res.status(404).json({ error: 'Not found' });
  await writeJSON(ORDERS_FILE, orders);
  res.json({ ok: true });
});

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Bomma Kadai API listening on http://localhost:${PORT}`);
});
