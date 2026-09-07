import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  if (!user) return <p className="text-center text-slate-400">Vui lòng đăng nhập.</p>;

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      let avatarUrl;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('logo', avatarFile);
        const { data } = await api.post('/games/upload-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        avatarUrl = data.url;
      }
      const { data } = await api.put('/auth/me', { displayName, bio, avatarUrl });
      setUser(data.user);
      setMsg('Đã lưu thay đổi.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Lưu thất bại.');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwMsg('Đổi mật khẩu thành công.');
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setPwError(err?.response?.data?.error || 'Đổi mật khẩu thất bại.');
    }
  };

  const becomeDeveloper = async () => {
    const { data } = await api.post('/auth/become-developer');
    setUser(data.user);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-6 md:p-8">
        <h2 className="text-xl font-orbitron font-bold neon-text-cyan uppercase mb-5">Hồ Sơ</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-cyan-700 overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-slate-500 text-xs">Logo</span>}
            </div>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="input-dark text-sm px-3 py-1.5 rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Tên hiển thị</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Giới thiệu</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="input-dark w-full px-4 py-2 rounded-lg" />
          </div>
          {msg && <p className="text-cyan-400 text-sm">{msg}</p>}
          {error && <p className="text-fuchsia-400 text-sm">{error}</p>}
          <button className="neon-button px-6 py-2 rounded-lg uppercase font-bold">Lưu Thay Đổi</button>
        </form>

        {user.role === 'player' && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-3">Muốn đăng game của riêng bạn? Nâng cấp lên gói Developer.</p>
            <button onClick={becomeDeveloper} className="neon-button-fuchsia px-6 py-2 rounded-lg uppercase font-bold">Đăng Ký Gói Dev</button>
          </div>
        )}
        {user.role !== 'player' && (
          <p className="mt-6 pt-6 border-t border-slate-800 text-sm text-cyan-400 uppercase font-semibold">Vai trò hiện tại: {user.role}</p>
        )}
      </div>

      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-6 md:p-8">
        <h2 className="text-xl font-orbitron font-bold neon-text-fuchsia uppercase mb-5">Đổi Mật Khẩu</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <input type="password" placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" required />
          <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" required minLength={6} />
          {pwMsg && <p className="text-cyan-400 text-sm">{pwMsg}</p>}
          {pwError && <p className="text-fuchsia-400 text-sm">{pwError}</p>}
          <button className="neon-button-fuchsia px-6 py-2 rounded-lg uppercase font-bold">Cập Nhật Mật Khẩu</button>
        </form>
      </div>
    </div>
  );
}
