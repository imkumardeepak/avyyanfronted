import { WebSocketManager } from './websocket-manager';

// Mock WebSocket implementation for testing
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState: number;
  
  constructor(public url: string) {
    this.readyState = WebSocket.CONNECTING;
  }
  
  send(data: string) {
    // Mock send implementation
    console.log('Sending data:', data);
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock the global WebSocket object
global.WebSocket = MockWebSocket as any;

describe('WebSocketManager', () => {
  let webSocketManager: WebSocketManager;
  
  beforeEach(() => {
    webSocketManager = new WebSocketManager();
  });
  
  afterEach(() => {
    webSocketManager.disconnect();
  });
  
  it('should connect to notifications WebSocket', () => {
    const userId = 'test-user-id';
    webSocketManager.connectToNotifications(userId);
    
    // Check that connection status is updated
    const status = webSocketManager.getConnectionStatus();
    expect(status.notifications).toBe('connecting');
  });
  
  it('should connect to chat WebSocket', () => {
    const userId = 'test-user-id';
    webSocketManager.connectToChat(userId);
    
    // Check that connection status is updated
    const status = webSocketManager.getConnectionStatus();
    expect(status.chat).toBe('connecting');
  });
  
  it('should handle adding and removing notification listeners', () => {
    const mockListener = jest.fn();
    
    // Add listener
    webSocketManager.addNotificationListener(mockListener);
    
    // Remove listener
    webSocketManager.removeNotificationListener(mockListener);
    
    // Verify no errors occurred
    expect(true).toBe(true);
  });
  
  it('should handle adding and removing chat listeners', () => {
    const mockListener = jest.fn();
    
    // Add listener
    webSocketManager.addChatListener(mockListener);
    
    // Remove listener
    webSocketManager.removeChatListener(mockListener);
    
    // Verify no errors occurred
    expect(true).toBe(true);
  });
});