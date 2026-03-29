
# MySQL setup — do this once

## Common errors

### `listen` / `EADDRINUSE` / port `5000`

Something else is already using **port 5000** (often another `node server.js` or Cursor’s old terminal).

- Close other terminals running the backend, **or**
- In **`fleet_backend/.env`** add: `PORT=5001`
- In **repo root** `.env` set: `VITE_API_URL=http://localhost:5001/api`
- Restart the frontend so it calls the new port.

### `Access denied for user 'root'@'localhost'`

MySQL rejected **`DB_PASSWORD`** in `.env`. Fix the password in MySQL (see §2 below) **or** put your real MySQL password in `.env`.

---

Your **`.env`** (repo root or `fleet_backend/.env`) should contain:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=masai123
DB_NAME=ucu_fleet_management
```

**`DB_PASSWORD` must match** what MySQL actually uses for `DB_USER`. If setup fails with “Access denied”, fix MySQL first, then retry.

---

## 1. Install and start MySQL

- Install [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) for Windows, **or** use XAMPP/WAMP and start the **MySQL** service.
- In **Services** (`services.msc`), confirm **MySQL** is **Running**.

---

## 2. Make the password match `.env`

Pick **one**:

### A) Set `root` password to `masai123` (matches your current `.env`)

1. Open **MySQL Command Line Client** or **MySQL Workbench** and sign in as `root` (however you currently can).
2. Run:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'masai123';
FLUSH PRIVILEGES;
```

### B) Keep your existing MySQL password

Edit **`FMS_frontend/.env`** and set:

```env
DB_PASSWORD=your_actual_mysql_password
```

---

## 3. Create schema (tables)

From **`fleet_backend`**:

```bash
npm run db:setup
```

This will:

- Create database `ucu_fleet_management` (if missing)
- Run `database/ucu_fleet_management_full_rebuild.sql`
- Run migration `003_mysql_app_documents_and_user_driver.sql`

If you see **`ER_DUP_FIELDNAME`** on `driver_id`, that’s OK (column already exists).

---

## 4. Copy `data.json` into MySQL

Still in **`fleet_backend`**:

```bash
npm run db:import
```

---

## 5. Start the API

```bash
npm start
```

You should see: **`✅ MySQL database connected successfully`**

If you see **`📁 Using JSON file storage`**, MySQL did not connect — recheck password, service, and `.env`.

---

## 6. Start the frontend

From **repo root** (`FMS_frontend`):

```bash
npm start
```

Ensure **`VITE_API_URL=http://localhost:5000/api`** in root `.env`.

---

## Quick checklist

| Step | Command / action |
|------|------------------|
| Password matches `.env` | `ALTER USER` or edit `.env` |
| Schema | `cd fleet_backend` → `npm run db:setup` |
| Data import | `npm run db:import` |
| API | `npm start` (see MySQL OK log) |
| UI | Root folder → `npm start` |

---

## MySQL version (5.5 vs 5.7+ / 8.0)

The bundled schema is **compatible with MySQL 5.5** (e.g. `DATETIME` for `updated_at`, `LONGTEXT` for JSON-style payloads, shortened unique index on email). **MySQL 5.7+ or 8.0** removes legacy limits (multiple `TIMESTAMP` defaults per table, native `JSON`, larger index prefixes with utf8mb4) and is recommended for new installs when you can choose the server version.

---

## No `mysql` in PATH?

That’s fine. This project uses **Node** (`npm run db:setup` / `db:import`) only — no `mysql.exe` required.
