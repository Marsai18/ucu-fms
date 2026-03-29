# MySQL data (full parity with `data.json`)

When `DB_HOST` and `DB_USER` are set in `fleet_backend/.env`, the API uses:

- **`users`** — real table (login, JWT, `/api/users`)
- **`app_documents`** — JSON payloads for vehicles, drivers, bookings, trips, notifications, etc. (same shape as in `data.json`)

## 1. Create the database schema

Apply your base schema (e.g. `database/schema.sql` or `ucu_fleet_management_full_rebuild.sql`, then):

```bash
mysql -u root -p ucu_fleet_management < database/migrations/003_mysql_app_documents_and_user_driver.sql
```

If `driver_id` already exists on `users`, you may see a duplicate-column error on the `ALTER` line — that is safe to ignore.

## 2. Configure `.env`

Set `DB_HOST`, `DB_USER`, and (usually) `DB_PASSWORD`, `DB_NAME` in **either**:

- the **repo root** `.env` (same file as `VITE_API_URL`), or  
- **`fleet_backend/.env`**

The backend loads **both** (root first, then `fleet_backend/.env` so the latter can override).

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ucu_fleet_management
```

## 3. Import everything from `data.json`

```bash
cd fleet_backend
npm run db:import
```

This clears `users` and `app_documents`, then re-imports all users and all document collections from `data.json`.

Use a **fresh** database or backup first. If you still have rows in legacy relational tables (e.g. old `bookings` rows with FKs to `users`), truncate those or use an empty DB.

## 4. Run the API

```bash
npm start
```

You should see: `✅ MySQL database connected successfully`.

## 5. Notes

- **Railway / production:** run the same migration + `npm run db:import` against your hosted MySQL (or pipe `data.json` into a one-off job).
- **Dual mode:** Without `DB_HOST`, the app keeps using `data.json` only (unchanged).
- **Passwords:** Imported as stored in JSON (plain or bcrypt). The app supports both.
- **JWT `id`:** Numeric MySQL user ids are serialized consistently in responses.
