# Avyaan Knitfab Frontend

This is the frontend application for the Avyaan Knitfab system, built with React, TypeScript, and Vite.

## Features

- User authentication and role-based access control
- Real-time notifications via WebSocket
- Real-time chat functionality via WebSocket
- Dashboard with analytics
- User and role management
- Machine management

## WebSocket Implementation

This application implements real-time communication using WebSockets for both notifications and chat functionality.

### Available Hooks

1. `useWebSocket` - Combined hook for both notifications and chat
2. `useNotifications` - Dedicated hook for notifications only
3. `useChat` - Dedicated hook for chat functionality

### Usage Examples

#### Using the Combined Hook

```tsx
import { useWebSocket } from '@/hooks';

const MyComponent = () => {
  const { 
    notifications, 
    messages, 
    connectionStatus, 
    sendMessage, 
    markNotificationAsRead,
    unreadNotificationCount
  } = useWebSocket();
  
  return (
    <div>
      <p>Unread notifications: {unreadNotificationCount}</p>
      <div>
        {notifications.map(notification => (
          <div key={notification.id}>
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>
            <button onClick={() => markNotificationAsRead(notification.id)}>
              Mark as read
            </button>
          </div>
        ))}
      </div>
      <div>
        {messages.map(message => (
          <div key={message.id}>
            <p>{message.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Using Individual Hooks

```tsx
import { useNotifications, useChat } from '@/hooks';

const MyComponent = () => {
  const { notifications, unreadCount, connectionStatus: notificationStatus } = useNotifications();
  const { messages, connectionStatus: chatStatus, sendMessage } = useChat();
  
  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Environment Configuration

To use WebSocket functionality, configure the following environment variables in your `.env.local` file:

```env
# WebSocket Configuration
VITE_WS_NOTIFICATIONS_URL=wss://your-domain.com/notifications
VITE_WS_CHAT_URL=wss://your-domain.com/chat
```

If these variables are not set, the application will construct WebSocket URLs from the `VITE_API_URL` by replacing `http` with `ws` and adjusting the path.

## Development

### Prerequisites

- Node.js (version compatible with package.json)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
# Check for linting issues
npm run lint:check

# Fix linting issues
npm run lint
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and API clients
├── pages/          # Page components
├── routes/         # Routing configuration
├── schemas/        # Form validation schemas
├── styles/         # CSS styles
├── types/          # TypeScript types
└── App.tsx         # Main application component
```

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API, React Query
- **Routing**: React Router DOM
- **UI Library**: Radix UI, Tailwind CSS
- **Form Handling**: React Hook Form, Zod
- **HTTP Client**: Axios
- **Real-time Communication**: WebSocket