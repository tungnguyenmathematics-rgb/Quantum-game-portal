import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import CodeEditor, { modeForFilename } from '../components/CodeEditor';

const DEFAULT_VFS = {
  'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Web Game Của Bạn</h1>\n  <script src="main.js"></script>\n</body>\n</html>',
  'style.css': 'body { background:#020617; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }',
  'main.js': 'console.log("Xin chào Quantum Portal!");',
};

const LANGUAGES = [
  'html', 'javascript', 'typescript', 'python', 'lua', 'ruby', 'php', 'webassembly',
  'c', 'c_cpp', 'csharp', 'java', 'rust', 'golang', 'swift', 'kotlin', 'dart',
];

export default function Publish() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(user?.displayName || '');
  const [desc, setDesc] = useState('');
  const [language, setLanguage] = useState('html');
  const [multiplayer, setMultiplayer] = useState(false);
  const [vfs, setVfs] = useState({ ...DEFAULT_VFS });
  const [currentFile, setCurrentFile] = useState('index.html');
  const [newFileName, setNewFileName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && user.role === 'player') {
    return (
      <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-700 rounded-xl p-8 text-center">
        <h2 className="text-xl font-orbitron font-bold text-fuchsia-400 mb-3 uppercase">Cần Gói Nhà Phát Triển</h2>
        <p className="text-slate-400 mb-5">Tài khoản của bạn hiện là Player. Hãy nâng cấp lên gói Developer (miễn phí) để đăng game.</p>
        <button
          className="neon-button px-6 py-2.5 rounded-lg uppercase font-bold"
          onClick={async () => { await api.post('/auth/become-developer'); window.location.reload(); }}
        >
          Đăng Ký Gói Dev
        </button>
      </div>
    );
  }

  const updateCurrentFileContent = (val) => setVfs((v) => ({ ...v, [currentFile]: val }));

  const addFile = () => {
    const name = newFileName.trim();
    if (!name) return setError('Nhập tên file.');
    if (vfs[name] !== undefined) return setError('File đã tồn tại.');
    setVfs((v) => ({ ...v, [name]: '' }));
    setCurrentFile(name);
    setNewFileName('');
    setError('');
  };

  const deleteFile = (name) => {
    if (Object.keys(vfs).length <= 1) return;
    const next = { ...vfs };
    delete next[name];
    setVfs(next);
    if (currentFile === name) setCurrentFile(Object.keys(next)[0]);
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    const fd = new FormData();
    fd.append('logo', logoFile);
    const { data } = await api.post('/games/upload-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Vui lòng nhập tên game.');
    setSubmitting(true);
    setError('');
    try {
      const logoUrl = await uploadLogo();
      const { data } = await api.post('/games', {
        title, desc, language, multiplayer,
        code: JSON.stringify(vfs),
        logoUrl,
      });
      navigate(`/play/${data.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng game thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-700 rounded-xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
      <h2 className="text-2xl md:text-3xl font-orbitron font-bold mb-6 neon-text-fuchsia uppercase">Khởi Tạo Game Mới</h2>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Tên Game *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Tác giả / Studio</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="input-dark w-full px-4 py-2 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Mô tả ngắn</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="input-dark w-full px-4 py-2 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Ngôn ngữ / Engine</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-dark w-full px-3 py-2 rounded-lg text-sm">
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-cyan-400 mb-1 uppercase">Logo Game (ảnh)</label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="input-dark w-full px-3 py-1.5 rounded-lg text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={multiplayer} onChange={(e) => setMultiplayer(e.target.checked)} className="accent-cyan-500" />
          Bật chơi online nhiều người (Quantum Multiplayer bridge)
        </label>

        <div className="flex flex-col md:flex-row h-[420px] border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col bg-slate-900/50 max-h-40 md:max-h-none">
            <div className="p-2 border-b border-slate-700 flex gap-2">
              <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="script.js" className="input-dark w-full text-xs px-2 py-1 rounded" />
              <button type="button" onClick={addFile} className="neon-button px-3 py-1 rounded text-xs font-bold">+</button>
            </div>
            <div className="flex-1 overflow-y-auto p-1 text-slate-300">
              {Object.keys(vfs).map((name) => (
                <div key={name} onClick={() => setCurrentFile(name)}
                  className={`px-2 py-1.5 text-sm flex justify-between items-center rounded cursor-pointer mb-0.5 ${name === currentFile ? 'bg-cyan-900/30 text-cyan-300 border-l-2 border-cyan-400' : 'hover:bg-white/5'}`}>
                  <span className="truncate">{name}</span>
                  {Object.keys(vfs).length > 1 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteFile(name); }} className="text-red-400 hover:text-red-300 px-1">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-2">
            <CodeEditor key={currentFile} initialValue={vfs[currentFile]} mode={modeForFilename(currentFile)} onChange={updateCurrentFileContent} height={'100%'} />
          </div>
        </div>

        {error && <p className="text-fuchsia-400 text-sm">{error}</p>}
        <button disabled={submitting} className="neon-button-fuchsia w-full py-2.5 rounded-lg uppercase font-bold">
          {submitting ? 'Đang đăng...' : 'Đăng Game'}
        </button>
      </form>
    </div>
  );
}
