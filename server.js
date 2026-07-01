const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve HLS streams
app.use('/hls', express.static(path.join(__dirname, '..', 'public', 'hls')));

const searchRoutes = require('./routes/search');
const camerasRoutes = require('./routes/cameras');
const paypalRoutes = require('./routes/paypal');

app.use(searchRoutes);
app.use(camerasRoutes);
app.use(paypalRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
