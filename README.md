# Bomma Kadai — Minimal API (admin-api branch)

This branch adds a minimal Node/Express backend to manage products and orders for the Bomma Kadai demo.

Features
- REST endpoints for products and orders
- Simple admin login issuing a JWT at POST /api/admin/login
- JSON file storage under /data (products.json, orders.json)
- CORS enabled and static file serving from /public

Quick start

1. Install dependencies

   npm install

2. Create a .env file (optional) in the project root to override defaults:

   PORT=5000
   ADMIN_PASSWORD=admin123
   JWT_SECRET=replace-with-secret

3. Run the server

   npm run dev

4. Open the admin UI (served by the server):

   http://localhost:5000/admin.html

Notes
- This is a demo server intended for development only. Do not run it in production without hardening.
- For production use, replace JSON file storage with a database (SQLite/Postgres) and secure the admin credentials.
