import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { buildRunnableHtml } from '../lib/gameRunner';

export default function Play() {
  const { id } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [roomSize, setRoomSize] = useState(0);
  const iframeRef = useRef(null);

  useEffect(() => {
    api.get(`/games/${id}`).then((res) => setGame(res.data.game)).catch(() => setError('Không tìm thấy game.'));
    api.post(`/games/${id}/play`).catch(() => {});
    api.get(`/scores/${id}/leaderboard`).then((res) => setLeaderboard(res.data.leaderboard)).catch(() => {});
  }, [id]);

  // Every game gets score-saving for free via window.QuantumSDK.submitScore.
  useEffect(() => {
    const onScoreMessage = async (e) => {
      const data = e.data;
      if (!data || !data.qpMultiplayer || data.type !== 'score') return;
      if (!user) return; // silently ignore for guests; UI already hints to log in
      try {
        await api.post(`/scores/${id}`, { score: data.score });
        const res = await api.get(`/scores/${id}/leaderboard`);
        setLeaderboard(res.data.leaderboard);
      } catch (err) { /* non-fatal */ }
    };
    window.addEventListener('message', onScoreMessage);
    return () => window.removeEventListener('message', onScoreMessage);
  }, [id, user]);

  // Relay postMessage from the sandboxed game iframe <-> Socket.IO room
  // (multiplayer-enabled games only).
  useEffect(() => {
    if (!game?.multiplayer) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onWindowMessage = (e) => {
      const data = e.data;
      if (!data || !data.qpMultiplayer) return;
      if (data.type === 'join') socket.emit('mp:join', { gameId: id, roomCode: data.roomCode || 'default' });
      if (data.type === 'state') socket.emit('mp:state', data.payload);
    };
    const onMpState = (msg) => iframeRef.current?.contentWindow?.postMessage({ qpMultiplayer: true, type: 'state', payload: msg.payload, from: msg.from }, '*');
    const onRoomSize = (n) => setRoomSize(n);

    window.addEventListener('message', onWindowMessage);
    socket.on('mp:state', onMpState);
    socket.on('mp:room-size', onRoomSize);
    return () => {
      window.removeEventListener('message', onWindowMessage);
      socket.off('mp:state', onMpState);
      socket.off('mp:room-size', onRoomSize);
    };
  }, [game, id]);

  const joinRoom = () => {
    const code = roomCode.trim() || 'default';
    iframeRef.current?.contentWindow?.postMessage({ qpMultiplayer: true, type: 'join', roomCode: code }, '*');
    getSocket().emit('mp:join', { gameId: id, roomCode: code });
  };

  if (error) return <p className="text-center text-fuchsia-400">{error}</p>;
  if (!game) return <p className="text-center text-cyan-400 animate-pulse">Đang tải game...</p>;

  const html = buildRunnableHtml(game);

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/" className="text-sm text-cyan-400 hover:underline">← Quay lại danh sách</Link>
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h2 className="text-2xl font-orbitron font-bold neon-text-cyan">{game.title}</h2>
            <span className="px-2 py-1 rounded text-xs font-bold uppercase border text-fuchsia-400 border-fuchsia-400 bg-fuchsia-400/10">{game.language}</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Tác giả: {game.author}</p>
          <p className="text-slate-400 text-sm mb-4">{game.desc}</p>

          {game.multiplayer && (
            <div className="mb-3 flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-700 rounded-lg p-3">
              <input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="Mã phòng (để trống = default)" className="input-dark px-3 py-1.5 rounded text-sm flex-1 min-w-[160px]" />
              <button onClick={joinRoom} className="neon-button px-4 py-1.5 rounded text-xs font-bold uppercase">Vào Phòng</button>
              <span className="text-xs text-slate-400">{roomSize} người trong phòng</span>
            </div>
          )}

          <div className="w-full aspect-video bg-white rounded-lg overflow-hidden border border-slate-700">
            <iframe ref={iframeRef} title={game.title} srcDoc={html} className="w-full h-full border-none" sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin" />
          </div>
        </div>

        <aside className="w-full lg:w-72 bg-slate-900/70 border border-slate-800 rounded-lg p-4 h-fit">
          <h3 className="font-orbitron font-bold text-fuchsia-400 mb-3 uppercase text-sm">Bảng Xếp Hạng</h3>
          {leaderboard.length === 0 && <p className="text-slate-500 text-sm">Chưa có điểm số nào.</p>}
          <ol className="space-y-1.5 text-sm">
            {leaderboard.map((r, i) => (
              <li key={i} className="flex justify-between text-slate-300">
                <span>{i + 1}. {r.displayName || r.username}</span>
                <span className="text-cyan-400 font-bold">{r.score}</span>
              </li>
            ))}
          </ol>
          {!user && <p className="text-xs text-slate-500 mt-3">Đăng nhập để lưu điểm số của bạn.</p>}
        </aside>
      </div>
    </div>
  );
}
