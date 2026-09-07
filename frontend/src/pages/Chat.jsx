import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const dmUserId = params.get('dm');
  const room = dmUserId ? `dm` : 'global';
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const url = dmUserId ? `/chat/dm/${dmUserId}` : '/chat/global';
    api.get(url).then((res) => setMessages(res.data.messages)).catch(() => {});

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    if (dmUserId) socket.emit('chat:join-dm', dmUserId);

    const onMessage = (msg) => {
      const targetRoom = dmUserId ? undefined : 'global';
      if (dmUserId || msg.room === 'global') setMessages((m) => [...m, msg]);
    };
    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [dmUserId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    const socket = getSocket();
    socket.emit('chat:send', { room: dmUserId ? undefined : 'global', body });
    setBody('');
  };

  if (!user) return <p className="text-center text-slate-400">Vui lòng đăng nhập để tham gia trò chuyện.</p>;

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-700 rounded-xl p-4 md:p-6 flex flex-col h-[70vh]">
      <h2 className="text-lg font-orbitron font-bold neon-text-cyan uppercase mb-3">{dmUserId ? 'Tin Nhắn Riêng' : 'Chat Cộng Đồng'}</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
        {messages.map((m, i) => (
          <div key={m.id || i} className={`flex flex-col ${m.from?.username === user.username ? 'items-end' : 'items-start'}`}>
            <span className="text-[11px] text-slate-500">{m.from?.displayName || m.from?.username}</span>
            <span className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] break-words ${m.from?.username === user.username ? 'bg-cyan-900/40 text-cyan-100' : 'bg-slate-800 text-slate-200'}`}>{m.body}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nhập tin nhắn..." className="input-dark flex-1 px-4 py-2 rounded-lg" />
        <button className="neon-button px-5 py-2 rounded-lg uppercase font-bold text-sm">Gửi</button>
      </form>
    </div>
  );
}
