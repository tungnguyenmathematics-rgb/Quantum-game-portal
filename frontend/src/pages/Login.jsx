import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-700 rounded-xl p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
      <h2 className="text-2xl font-orbitron font-bold mb-6 neon-text-cyan uppercase">Đăng Nhập</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Tên đăng nhập</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Mật khẩu</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" required />
        </div>
        {error && <p className="text-fuchsia-400 text-sm">{error}</p>}
        <button disabled={loading} className="neon-button w-full py-2.5 rounded-lg uppercase font-bold">
          {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-4 text-center">
        Chưa có tài khoản? <Link to="/register" className="text-cyan-400 hover:underline">Đăng ký</Link>
      </p>
    </div>
  );
}
