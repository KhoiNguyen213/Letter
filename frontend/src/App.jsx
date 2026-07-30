import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LetterEditor from './pages/LetterEditor.jsx';
import LetterViewer from './pages/LetterViewer.jsx';
import SharedLetter from './pages/SharedLetter.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useTranslation } from 'react-i18next';
import { apiFetch, API_BASE } from './utils/api.js';

// Route protection wrapper
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center font-serif italic text-zinc-500">
        {t('common:loading')}
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Helper component to auto-create and redirect
const QuickCreate = () => {
  const { t } = useTranslation();
  const [error, setError] = React.useState('');
  const [triggered, setTriggered] = React.useState(false);
  const navigate = React.useNavigate();

  React.useEffect(() => {
    if (triggered) return;
    setTriggered(true);

    const createDraft = async () => {
      try {
        const letter = await apiFetch('/letters', { method: 'POST' });
        navigate(`/edit/${letter._id}`, { replace: true });
      } catch (err) {
        console.error(err);
        setError(t('dashboard:db_warning'));
      }
    };

    createDraft();
  }, [navigate, triggered, t]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="paper-dark p-8 rounded-2xl max-w-sm text-center">
          <p className="text-red-400 font-serif italic mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xs text-gold-accent hover:text-gold-text underline uppercase tracking-widest"
          >
            {t('common:back_to_index')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center font-serif italic text-zinc-500">
      {t('editor:loading_title')}
    </div>
  );
};

export default function App() {
  if (!import.meta.env.VITE_API_URL && !import.meta.env.DEV) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="paper-dark p-8 rounded-2xl max-w-md text-center border border-red-500/20">
          <h2 className="text-xl font-serif text-zinc-200 mb-2">Configuration Error</h2>
          <p className="text-sm text-zinc-400 font-serif italic mb-4">
            The frontend is missing the backend API URL configuration.
          </p>
          <p className="text-xs text-zinc-500 font-sans leading-relaxed">
            Please define the <code className="text-gold-accent bg-black/40 px-1 py-0.5 rounded font-mono">VITE_API_URL</code> environment variable in your Vercel settings or local <code className="text-gold-accent bg-black/40 px-1 py-0.5 rounded font-mono">.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Sharing Link */}
          <Route path="/letter/:slug" element={<SharedLetter />} />

          {/* Owner Credentials */}
          <Route path="/login" element={<Login />} />

          {/* Owner Dashboard and Letters manager */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/create"
            element={
              <PrivateRoute>
                <QuickCreate />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <LetterEditor />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/view/:id"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <LetterViewer />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Fallback routing */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
