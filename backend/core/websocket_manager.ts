/**
 * AquaWatch Core - WebSocket Manager
 * 
 * Manages real-time bi-directional WebSocket connections to stream live telemetry,
 * instantaneous anomaly detection alerts, priority tickets, and citizen report updates.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { WebSocketMessage } from '../../src/types';

export class WebSocketManager {
  private static wss: WebSocketServer | null = null;
  private static clients: Set<WebSocket> = new Set();

  public static initialize(server: any) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[AquaWatch WS] Client connected. Total active clients: ${this.clients.size}`);

      // Send initial welcome/handshake packet
      ws.send(JSON.stringify({
        type: 'SYSTEM_STATS',
        timestamp: new Date().toISOString(),
        data: { message: 'Connected to AquaWatch Realtime Telemetry Stream' }
      }));

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          console.log('[AquaWatch WS] Received client message:', parsed.type);
        } catch (e) {
          // ignore non-json ping
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[AquaWatch WS] Client disconnected. Active clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[AquaWatch WS] Connection error:', err);
        this.clients.delete(ws);
      });
    });
  }

  /**
   * Broadcasts a typed message packet to all connected dashboard & client terminals
   */
  public static broadcast(message: WebSocketMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.error('[AquaWatch WS] Failed to send to client:', err);
        }
      }
    });
  }

  public static getActiveClientCount(): number {
    return this.clients.size;
  }
}
