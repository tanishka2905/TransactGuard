import { useEffect, useRef, useState, useCallback } from 'react';
import type { Transaction, FraudAlert } from '../types';

interface WebSocketMessage {
  event: 'CONNECTED' | 'PONG' | 'NEW_TRANSACTION' | 'NEW_ALERT' | 'TRANSACTION_UNBLOCKED' | 'ALERT_RESOLVED' | 'TRANSACTION_UPDATED';
  data?: any;
  message?: string;
}

export function useWebSocket(
  onNewTransaction?: (txn: Transaction) => void,
  onNewAlert?: (alert: FraudAlert) => void,
  onTransactionUnblocked?: (data: any) => void,
  onAlertResolved?: (data: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectFnRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = 'ws://localhost:8000/ws/transactions';
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setLastHeartbeat(new Date());
      };

      ws.onmessage = (event) => {
        try {
          const payload: WebSocketMessage = JSON.parse(event.data);
          if (payload.event === 'NEW_TRANSACTION' && payload.data && onNewTransaction) {
            onNewTransaction(payload.data);
          } else if (payload.event === 'NEW_ALERT' && payload.data && onNewAlert) {
            onNewAlert(payload.data);
          } else if (payload.event === 'TRANSACTION_UNBLOCKED') {
            if (onTransactionUnblocked && payload.data) onTransactionUnblocked(payload.data);
            window.dispatchEvent(new CustomEvent('transaction_unblocked', { detail: payload.data }));
          } else if (payload.event === 'ALERT_RESOLVED') {
            if (onAlertResolved && payload.data) onAlertResolved(payload.data);
            window.dispatchEvent(new CustomEvent('alert_resolved', { detail: payload.data }));
          } else if (payload.event === 'TRANSACTION_UPDATED') {
            window.dispatchEvent(new CustomEvent('transaction_updated', { detail: payload.data }));
          }
        } catch (e) {
          console.error('[WebSocket] Message parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (connectFnRef.current) connectFnRef.current();
        }, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    } catch {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (connectFnRef.current) connectFnRef.current();
      }, 3000);
    }
  }, [onNewTransaction, onNewAlert]);

  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastHeartbeat };
}
