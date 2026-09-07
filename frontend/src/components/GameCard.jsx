import { Link } from 'react-router-dom';

export default function GameCard({ game }) {
  return (
    <Link to={`/play/${game.id}`} className="card-glow rounded-xl p-4 flex flex-col h-full">
      <div className="w-full aspect-video rounded-lg bg-slate-950 border border-slate-800 mb-3 flex items-center justify-center overflow-hidden">
        {game.logoUrl ? (
          <img src={game.logoUrl} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-orbitron text-2xl text-slate-700">?</span>
        )}
      </div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-orbitron font-bold text-cyan-300 truncate">{game.title}</h3>
        {game.multiplayer ? (
          <span className="text-[10px] px-2 py-0.5 rounded border border-fuchsia-400 text-fuchsia-400 uppercase font-bold">Online</span>
        ) : null}
      </div>
      <p className="text-xs text-slate-400 mb-2">bởi {game.author}</p>
      <p className="text-sm text-slate-400 line-clamp-2 mt-auto">{game.desc || 'Chưa có mô tả.'}</p>
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800 text-xs text-slate-500">
        <span className="uppercase font-bold text-fuchsia-400">{game.language}</span>
        <span>{game.plays} lượt chơi</span>
      </div>
    </Link>
  );
}
