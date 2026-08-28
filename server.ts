/**
 * AquaWatch Backend Server
 * Express + WebSockets + Vite Middleware
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRouter from './backend/api/auth';
import zonesRouter from './backend/api/zones';
import anomaliesRouter from './backend/api/anomalies';
import maintenanceRouter from './backend/api/maintenance';
import citizenReportsRouter from './backend/api/citizen_reports';
import ingestionRouter from './backend/api/ingestion';

import { WebSocketManager } from './backend/core/websocket_manager';
import { TelemetrySimulator } from './backend/simulator/data_generator';
import { DataStore } from './backend/db/in_memory_store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/zones', zonesRouter);
  app.use('/api/anomalies', anomaliesRouter);
  app.use('/api/maintenance', maintenanceRouter);
  app.use('/api/citizen-reports', citizenReportsRouter);
  app.use('/api', ingestionRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'AquaWatch Urban Water Leakage & Loss Detection System',
      timestamp: new Date().toISOString(),
      active_anomalies: DataStore.anomalyEvents.filter(e => e.status !== 'resolved').length,
      open_tickets: DataStore.maintenanceTickets.filter(t => t.status !== 'verified_fixed').length
    });
  });

  const server = http.createServer(app);

  // Initialize Native WebSocket Server on path /ws
  WebSocketManager.initialize(server);

  // Start background hydraulic telemetry simulator loop with real-time WebSocket broadcast
  TelemetrySimulator.startSimulationLoop((frame) => {
    WebSocketManager.broadcast({
      type: 'TELEMETRY_UPDATE',
      timestamp: frame.timestamp,
      data: {
        readings: frame.readings,
        newAnomalies: frame.newAnomalies,
        newTickets: frame.newTickets,
        summary: DataStore.getCitySummary()
      }
    });
  });

  // Vite middleware for development vs production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AquaWatch] Server live on http://localhost:${PORT}`);
    console.log(`[AquaWatch] WebSocket streaming on ws://localhost:${PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('[AquaWatch] Failed to start server:', err);
});
