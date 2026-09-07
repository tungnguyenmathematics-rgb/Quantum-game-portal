import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import db from './db/index.js';
import { JWT_SECRET } from './middleware/auth.js';
import { roomFor } from './routes/chat.js';

import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';
import scoreRoutes from './routes/scores.js';
import friendRoutes from './routes/friends.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// ---- Realtime: global/DM chat + generic multiplayer room relay ----
// Any published game with `multiplayer: true` can join a room named
// `game:<gameId>:<roomCode>` and broadcast/receive JSON state updates —
// this gives arbitrary browser games a ready-made online-multiplayer
// transport without each one needing its own server.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
    } catch (e) { /* connect anonymously */ }
  }
  next();
});

io.on('connection', (socket) => {
  socket.join('global');

  socket.on('chat:send', ({ room, body }) => {
    if (!socket.user) return;
    const targetRoom = room || 'global';
    if (!body || !body.trim()) return;
    db.prepare('INSERT INTO messages (room, from_user_id, body) VALUES (?, ?, ?)')
      .run(targetRoom, socket.user.id, body.slice(0, 1000));
    const user = db.prepare('SELECT username, display_name, avatar_url FROM users WHERE id = ?').get(socket.user.id);
    io.to(targetRoom).emit('chat:message', {
      body: body.slice(0, 1000),
      from: { username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url },
      createdAt: Date.now(),
      room: targetRoom,
    });
  });

  socket.on('chat:join-dm', (otherUserId) => {
    if (!socket.user) return;
    socket.join(roomFor(socket.user.id, otherUserId));
  });

  // ---- Generic multiplayer game rooms ----
  socket.on('mp:join', ({ gameId, roomCode }) => {
    const room = `game:${gameId}:${roomCode}`;
    socket.join(room);
    socket.data.mpRoom = room;
    socket.to(room).emit('mp:peer-joined', { id: socket.id });
    const size = io.sockets.adapter.rooms.get(room)?.size || 1;
    io.to(room).emit('mp:room-size', size);
  });

  socket.on('mp:state', (payload) => {
    if (!socket.data.mpRoom) return;
    socket.to(socket.data.mpRoom).emit('mp:state', { from: socket.id, payload });
  });

  socket.on('disconnect', () => {
    if (socket.data.mpRoom) {
      socket.to(socket.data.mpRoom).emit('mp:peer-left', { id: socket.id });
    }
  });
});

// ---- Serve the built React frontend in production ----
const CLIENT_DIST = path.join(__dirname, '..', 'public');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Quantum Portal backend listening on port ${PORT}`);
});
