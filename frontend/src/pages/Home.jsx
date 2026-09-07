import { useEffect, useState } from 'react';
import api from '../lib/api';
import GameCard from '../components/GameCard';

export default function Home() {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/games').then((res) => setGames(res.data.games)).catch(() => setError('Không thể tải danh sách game.'));
  }, []);

  return (
    <section>
      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-orbitron font-extrabold text-white mb-4 uppercase tracking-widest neon-text-cyan">
          Khám Phá Đa Vũ Trụ Game
        </h2>
        <p className="text-base md:text-lg text-cyan-100/70 max-w-2xl mx-auto">
          Trải nghiệm các tựa game Web, HTML5, JS được xuất bản từ cộng đồng lập trình viên.
        </p>
      </div>

      {error && <p className="text-center text-fuchsia-400">{error}</p>}

      {!games && !error && (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
          <span className="text-cyan-400 font-orbitron tracking-widest animate-pulse">ĐANG TẢI DỮ LIỆU...</span>
        </div>
      )}

      {games && games.length === 0 && (
        <p className="text-center text-slate-400">Chưa có game nào được đăng. Hãy là người đầu tiên!</p>
      )}

      {games && games.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {games.map((g) => <GameCard key={g.id} game={g} />)}
        </div>
      )}
    </section>
  );
}
