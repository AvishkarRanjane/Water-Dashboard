/**
 * AquaWatch useWebSocket Hook
 * 
 * Provides continuous real-time telemetry streaming:
 * 1. Connects to native WebSocket server when running with backend.
 * 2. Gracefully falls back to client-side simulated telemetry ticks when deployed on Vercel
 *    or when WebSocket server is unreachable.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage } from '../types';
import { API } from '../services/api';

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Client-side simulated telemetry ticker for static Vercel deployments
  const startFallbackSimulation = useCallback(() => {
    if (fallbackIntervalRef.current) return;
    setIsConnected(true);

    fallbackIntervalRef.current = setInterval(async () => {
      try {
        const [summary, zones, sensors] = await Promise.all([
          API.getCitySummary(),
          API.getZones(),
          API.getSensors()
        ]);

        // Add subtle stochastic jitter to sensor readings
        const updatedSensors = sensors.map((s) => {
          const jitter = (Math.random() - 0.5) * (s.type === 'flow' ? 1.5 : 0.05);
          return {
            ...s,
            current_reading: Number(Math.max(0.1, s.current_reading + jitter).toFixed(2)),
            last_ping: new Date().toISOString()
          };
        });

        const mockMsg: WebSocketMessage = {
          type: 'TELEMETRY_UPDATE',
          timestamp: new Date().toISOString(),
          data: {
            summary,
            zones,
            sensors: updatedSensors
          }
        };

        setLastMessage(mockMsg);
        if (onMessage) {
          onMessage(mockMsg);
        }
      } catch (err) {
        // ignore tick errors
      }
    }, 5000);
  }, [onMessage]);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onMessage) {
            onMessage(parsed);
          }
        } catch (err) {
          // ignore unparsed raw frames
        }
      };

      ws.onclose = () => {
        // Fall back to client simulation when disconnected
        startFallbackSimulation();
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 8000);
      };

      ws.onerror = () => {
        startFallbackSimulation();
        ws.close();
      };
    } catch (e) {
      startFallbackSimulation();
    }
  }, [onMessage, startFallbackSimulation]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}
