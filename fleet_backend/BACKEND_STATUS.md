# Backend Status ✅

## Backend is RUNNING!

- **Status**: ✅ OPERATIONAL
- **Port**: 5000
- **Health Check**: http://localhost:5000/health
- **API Base URL**: http://localhost:5000/api
- **Storage**: JSON file storage (data.json)

## Quick Test

```bash
# Health check
curl http://localhost:5000/health

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"masai","password":"masai123"}'
```

## Default Credentials

- **Admin**: masai / masai123
- **Client**: client@ucu.ac.ug / client123

## To Start Backend

```bash
cd fleet_backend
npm start
```

## To Switch to MySQL

1. Set up MySQL database
2. Create `.env` file with:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=ucu_fleet_management
   ```
3. Run: `npm run init-db`
4. Restart backend










