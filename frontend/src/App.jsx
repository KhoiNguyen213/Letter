import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LettersPage from './pages/LettersPage.jsx';
import LetterEditor from './pages/LetterEditor.jsx';
import LetterViewer from './pages/LetterViewer.jsx';
import DiaryPage from './pages/DiaryPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import AIPage from './pages/AIPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useTranslation } from 'react-i18next';
import { apiFetch } from './utils/api.js';

// Private Route Guard
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center font-serif italic text-zinc-500">
        {t('common:loading', 'Đang xác thực không gian riêng...')}
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Helper component to auto-create letter draft
const QuickCreateLetter = () => {
  const navigate = useNavigate();
  const [triggered, setTriggered] = React.useState(false);

  React.useEffect(() => {
    if (triggered) return;
    setTriggered(true);

    const createDraft = async () => {
      try {
        const letter = await apiFetch('/letters', {
          method: 'POST',
          body: JSON.stringify({
            recipient: 'Gửi bản thân',
            title: 'Lá thư chưa đặt tên',
            content: '',
            status: 'Draft',
          }),
        });
        navigate(`/letters/edit/${letter._id}`, { replace: true });
      } catch (err) {
        console.error(err);
        navigate('/letters', { replace: true });
      }
    };

    createDraft();
  }, [navigate, triggered]);

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center font-serif italic text-zinc-500">
      Đang chuẩn bị trang viết thư...
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Owner Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/letters"
            element={
              <PrivateRoute>
                <LettersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/letters/new"
            element={
              <PrivateRoute>
                <QuickCreateLetter />
              </PrivateRoute>
            }
          />
          <Route
            path="/letters/edit/:id"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <LetterEditor />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/letters/view/:id"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <LetterViewer />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Legacy routes backwards compatibility */}
          <Route path="/create" element={<Navigate to="/letters/new" replace />} />
          <Route path="/edit/:id" element={<Navigate to="/letters/edit/:id" replace />} />
          <Route path="/view/:id" element={<Navigate to="/letters/view/:id" replace />} />

          {/* Diary Route */}
          <Route
            path="/diary"
            element={
              <PrivateRoute>
                <DiaryPage />
              </PrivateRoute>
            }
          />

          {/* Notes Route */}
          <Route
            path="/notes"
            element={
              <PrivateRoute>
                <NotesPage />
              </PrivateRoute>
            }
          />

          {/* AI Gemini Space Route */}
          <Route
            path="/ai"
            element={
              <PrivateRoute>
                <AIPage />
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
