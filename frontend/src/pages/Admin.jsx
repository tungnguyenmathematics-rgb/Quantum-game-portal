import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const load = () => {
    api.get('/admin/stats').then((res) => setStats(res.data));
    api.get('/admin/users').then((res) => setUsers(res.data.users));
  };
  useEffect(() => { load(); }, []);

  if (!user || user.role !== 'admin') return <p className="text-center text-fuchsia-400">Chỉ Admin mới truy cập được trang này.</p>;

  const setRole = async (id, role) => {
    await api.put(`/admin/users/${id}/role`, { role });
    load();
  };
  const deleteUser = async (id) => {
    if (!confirm('Xoá tài khoản này?')) return;
    await api.delete(`/admin/users/${id}`);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-orbitron font-bold neon-text-fuchsia uppercase">Bảng Điều Khiển Admin</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Người dùng', stats.users], ['Game', stats.games], ['Lượt chơi', stats.plays], ['Điểm số', stats.scores]].map(([label, val]) => (
            <div key={label} className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-orbitron font-bold text-cyan-400">{val}</div>
              <div className="text-xs text-slate-400 uppercase mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 uppercase text-xs border-b border-slate-800">
              <th className="py-2">Tên đăng nhập</th>
              <th>Hiển thị</th>
              <th>Vai trò</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800/60">
                <td className="py-2">{u.username}</td>
                <td>{u.display_name}</td>
                <td>
                  <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="input-dark px-2 py-1 rounded text-xs">
                    <option value="player">player</option>
                    <option value="developer">developer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="text-right">
                  <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs uppercase font-bold">Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
