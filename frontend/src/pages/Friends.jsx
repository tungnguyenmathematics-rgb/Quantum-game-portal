import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/friends').then((res) => { setFriends(res.data.friends); setPending(res.data.pending); });

  useEffect(() => { load(); }, []);

  const sendRequest = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api.post(`/friends/request/${username}`);
      setMsg(`Đã gửi lời mời kết bạn tới ${username}.`);
      setUsername('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Gửi lời mời thất bại.');
    }
  };

  const respond = async (id, accept) => {
    await api.post(`/friends/respond/${id}`, { accept });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-orbitron font-bold neon-text-cyan uppercase mb-4">Kết Bạn</h2>
        <form onSubmit={sendRequest} className="flex gap-2">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập người bạn muốn kết bạn" className="input-dark flex-1 px-4 py-2 rounded-lg" />
          <button className="neon-button px-5 py-2 rounded-lg uppercase font-bold text-sm">Gửi</button>
        </form>
        {msg && <p className="text-cyan-400 text-sm mt-2">{msg}</p>}
        {error && <p className="text-fuchsia-400 text-sm mt-2">{error}</p>}
      </div>

      {pending.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-6">
          <h3 className="font-orbitron font-bold text-fuchsia-400 uppercase mb-3 text-sm">Lời Mời Đang Chờ</h3>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2">
                <span>{p.display_name || p.username}</span>
                <div className="flex gap-2">
                  <button onClick={() => respond(p.id, true)} className="neon-button px-3 py-1 rounded text-xs font-bold">Chấp Nhận</button>
                  <button onClick={() => respond(p.id, false)} className="neon-button-fuchsia px-3 py-1 rounded text-xs font-bold">Từ Chối</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-6">
        <h3 className="font-orbitron font-bold text-cyan-400 uppercase mb-3 text-sm">Bạn Bè ({friends.length})</h3>
        {friends.length === 0 && <p className="text-slate-500 text-sm">Chưa có bạn bè nào.</p>}
        <ul className="space-y-2">
          {friends.map((f) => (
            <li key={f.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2">
              <span>{f.display_name || f.username}</span>
              <Link to={`/chat?dm=${f.id}`} className="text-xs text-cyan-400 hover:underline uppercase font-bold">Nhắn tin</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
