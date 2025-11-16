// server.js - Production server entry point
const app = require('./src/app');
// const { startScheduler } = require('./src/services/recurringInvoiceService');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  // startScheduler();
});

