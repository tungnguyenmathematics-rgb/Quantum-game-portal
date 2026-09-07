import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.password, form.displayName);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-700 rounded-xl p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
      <h2 className="text-2xl font-orbitron font-bold mb-6 neon-text-fuchsia uppercase">Tạo Tài Khoản</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Tên đăng nhập</label>
          <input value={form.username} onChange={change('username')} className="input-dark w-full px-4 py-2 rounded-lg" required minLength={3} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Tên hiển thị</label>
          <input value={form.displayName} onChange={change('displayName')} className="input-dark w-full px-4 py-2 rounded-lg" placeholder="Tuỳ chọn" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Mật khẩu</label>
          <input type="password" value={form.password} onChange={change('password')} className="input-dark w-full px-4 py-2 rounded-lg" required minLength={6} />
        </div>
        {error && <p className="text-fuchsia-400 text-sm">{error}</p>}
        <button disabled={loading} className="neon-button-fuchsia w-full py-2.5 rounded-lg uppercase font-bold">
          {loading ? 'Đang xử lý...' : 'Đăng Ký'}
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-4 text-center">
        Đã có tài khoản? <Link to="/login" className="text-cyan-400 hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}
