import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket;

export function getSocket() {
  if (socket) return socket;

  const token = localStorage.getItem('token');

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: token ? { token } : undefined
  });

  // Register the current user on connect. Socket.IO queues emits until connected,
  // but doing it here ensures it happens after reconnects too.
  socket.on('connect', () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user && user._id) {
        socket.emit('join', user._id);
      }
    } catch {
      // ignore
    }
  });

  socket.on('connect_error', (err) => {
    // Keep as warn; Socket.IO may fallback transports during dev.
    console.warn('Socket connect_error:', err?.message || err);
  });

  return socket;
}

// Optional helper for logout / hard reset flows.
export function resetSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
