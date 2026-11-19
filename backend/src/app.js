require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const apiKey = require('./middleware/apiKey');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));   // admin dashboard

app.use('/api', apiKey, routes);
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
