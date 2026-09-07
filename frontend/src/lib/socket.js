import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      auth: { token: localStorage.getItem('qp_token') || null },
    });
  }
  return socket;
}

export function reconnectSocket() {
  const s = getSocket();
  s.auth = { token: localStorage.getItem('qp_token') || null };
  if (s.connected) s.disconnect();
  s.connect();
  return s;
}
