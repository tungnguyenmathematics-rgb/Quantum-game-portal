import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Publish from './pages/Publish';
import Play from './pages/Play';
import Settings from './pages/Settings';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import { useAuth } from './context/AuthContext';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center text-cyan-400 animate-pulse">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/play/:id" element={<Play />} />
          <Route path="/publish" element={<Protected><Publish /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/friends" element={<Protected><Friends /></Protected>} />
          <Route path="/chat" element={<Protected><Chat /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="*" element={<p className="text-center text-slate-400">Không tìm thấy trang.</p>} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Quantum Game Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
