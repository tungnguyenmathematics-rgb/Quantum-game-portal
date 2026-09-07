import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Trang Chủ' },
    { to: '/publish', label: 'Đăng Game', authOnly: true },
    { to: '/chat', label: 'Chat' },
    { to: '/friends', label: 'Bạn Bè', authOnly: true },
  ];

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-cyan-800 shadow-[0_4px_15px_rgba(6,182,212,0.15)] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 font-orbitron font-extrabold tracking-wider text-xl md:text-2xl">
            QUANTUM PORTAL
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          {links.filter((l) => !l.authOnly || user).map((l) => (
            <Link key={l.to} to={l.to} className="text-gray-300 hover:text-cyan-400 font-semibold uppercase tracking-wider text-sm transition-colors">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/settings" className="text-gray-300 hover:text-cyan-400 font-semibold uppercase tracking-wider text-sm">
                {user.displayName || user.username}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold uppercase tracking-wider text-sm">Admin</Link>
              )}
              <button onClick={() => { logout(); navigate('/'); }} className="neon-button-fuchsia px-4 py-1.5 rounded uppercase font-bold text-sm">
                Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-cyan-400 font-semibold uppercase text-sm">Đăng Nhập</Link>
              <Link to="/register" className="neon-button px-4 py-1.5 rounded uppercase font-bold text-sm">Đăng Ký</Link>
            </>
          )}
        </nav>

        <button className="md:hidden text-cyan-400 text-2xl" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          ☰
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-col gap-3">
          {links.filter((l) => !l.authOnly || user).map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-gray-300 uppercase text-sm font-semibold">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/settings" onClick={() => setOpen(false)} className="text-cyan-400 uppercase text-sm font-semibold">Cài Đặt / {user.username}</Link>
              {user.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)} className="text-fuchsia-400 uppercase text-sm font-semibold">Admin</Link>}
              <button onClick={() => { logout(); setOpen(false); navigate('/'); }} className="neon-button-fuchsia px-4 py-2 rounded uppercase font-bold text-sm">Đăng Xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-gray-300 uppercase text-sm font-semibold">Đăng Nhập</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="neon-button px-4 py-2 rounded uppercase font-bold text-sm text-center">Đăng Ký</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
