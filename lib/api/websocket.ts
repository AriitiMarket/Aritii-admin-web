// WebSocket client for Admin Dashboard real-time features
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.notifyListeners(message.type, message.data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }

  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  unsubscribe(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  private notifyListeners(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Create WebSocket client instance
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
export const wsClient = new WebSocketClient(WS_URL);

// Subscription hooks for real-time order updates
export const useOrderSubscription = (restaurantId: string, callback: (data: any) => void) => {
  wsClient.subscribe('PLACE_ORDER', callback);
  
  // Send subscription request
  wsClient.send('SUBSCRIBE_PLACE_ORDER', { restaurantId });

  return () => {
    wsClient.unsubscribe('PLACE_ORDER', callback);
    wsClient.send('UNSUBSCRIBE_PLACE_ORDER', { restaurantId });
  };
};

export const useDispatchSubscription = (callback: (data: any) => void) => {
  wsClient.subscribe('DISPATCH_ORDER', callback);
  
  wsClient.send('SUBSCRIBE_DISPATCH', {});

  return () => {
    wsClient.unsubscribe('DISPATCH_ORDER', callback);
    wsClient.send('UNSUBSCRIBE_DISPATCH', {});
  };
};

export const useOrderStatusSubscription = (orderId: string, callback: (data: any) => void) => {
  wsClient.subscribe('ORDER_STATUS', callback);
  
  wsClient.send('SUBSCRIBE_ORDER_STATUS', { orderId });

  return () => {
    wsClient.unsubscribe('ORDER_STATUS', callback);
    wsClient.send('UNSUBSCRIBE_ORDER_STATUS', { orderId });
  };
};
