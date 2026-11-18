# Batloung Farm deployment checklist

This is a Node.js/Express application that serves its own dashboard from `frontend/` and API from `/api`. Deploy it as one web service; do not deploy `frontend/` separately to Netlify.

## Railway deployment
1. Create a Railway account and a new project.
2. Add a MySQL database service. Wait until it is running.
3. Create a GitHub repository and upload the contents of this folder (not `node_modules` and not `.env`).
4. In Railway, add a Node.js service from that GitHub repository.
5. Set the Node service root directory to the repository root. Build command: `npm install`. Start command: `npm start`.
6. In the Node service Variables, map the MySQL service's connection values to the names this application expects:
   - `DB_HOST` = MySQL host
   - `DB_PORT` = MySQL port
   - `DB_USER` = MySQL username
   - `DB_PASSWORD` = MySQL password
   - `DB_NAME` = MySQL database name
   - `DB_SSL` = `false` unless your provider specifically requires TLS
   - `PORT` is supplied by Railway; the application reads it automatically.
7. Initialize the database exactly once after the variables are set. In the Railway Node service, open its shell and run `npm run db:setup`. This executes `database/schema.sql` and `database/seed.sql`. Do not run it again on a live database unless you intend to reinitialize the sample data.
8. Generate a public domain for the Node service in Railway's Networking/Settings area.
9. Open `https://YOUR-DOMAIN/` for the dashboard and `https://YOUR-DOMAIN/api/health` to verify the server and MySQL connection.

## Important
- Never upload `.env`, passwords, or `node_modules` to GitHub. The original archive contained a `.env` file; rotate/change the database password it contained before deploying.
- Keep the MySQL service and Node service in the same Railway project/region where possible.
- The dashboard uses the relative API path `/api`, so hosting the dashboard and API on the same domain is intentional.
- This app's optional `ADMIN_API_KEY` middleware protects every `/api` route when configured. If you set it, the dashboard's browser requests must also be updated to send the `x-api-key` header; otherwise the dashboard API calls will receive 401 responses. Leave it unset for the current dashboard until authentication is implemented, and do not treat the unprotected dashboard as suitable for public production use with real business data.
