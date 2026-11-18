require('dotenv').config();
const app = require('./app');
const { checkConnection } = require('./config/db');

const DEFAULT_PORT = Number(process.env.PORT) || 3100;
const MAX_PORT_ATTEMPTS = 20;

// The process must never die because of a database problem.
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

let port = DEFAULT_PORT;
let portAttempts = 0;
const server = app.listen(port, async () => {
  const address = server.address();
  const listeningPort = typeof address === 'object' && address ? address.port : port;
  console.log(`Batloung Farm API running on http://localhost:${listeningPort}`);
  const db = await checkConnection();
  if (db.ok) console.log(`✔ ${db.message}`);
  else console.error(`✖ ${db.message}\n  The server stays up; API calls will return 503 until MySQL is reachable.`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && portAttempts < MAX_PORT_ATTEMPTS && port < 65535) {
    const previousPort = port;
    port += 1;
    portAttempts += 1;
    console.warn(`Port ${previousPort} is already in use; trying port ${port}.`);
    server.listen(port);
    return;
  }

  console.error(err);
  process.exit(1);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
