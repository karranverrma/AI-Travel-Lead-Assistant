const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger');
const chatRoutes = require('./routes/chat.routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { isConfigured: isGeminiConfigured, getModelName } = require('./config/gemini');
const { isSupabaseConfigured } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} — ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/chat', chatRoutes);

// ─── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Server started`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  
  // Log configuration status (without exposing secrets)
  console.log(`\n  🚀 AI Travel Lead Assistant API`);
  console.log(`  ─────────────────────────────`);
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log(`  Chat:      POST http://localhost:${PORT}/api/chat`);
  console.log(`  Env:       ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Gemini:    ${isGeminiConfigured() ? '✅ Configured' : '❌ Not configured (GEMINI_API_KEY missing)'}`);
  console.log(`  Model:     ${getModelName()}`);
  console.log(`  Supabase:  ${isSupabaseConfigured() ? '✅ Configured' : '⚠️  Not configured (leads stored in memory only)'}`);
  console.log(`\n`);
});

module.exports = app;