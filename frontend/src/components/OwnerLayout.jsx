import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, PenTool, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function OwnerLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Quiet Elegant Header */}
      <header className="border-b border-border-warm py-6 px-8 flex items-center justify-between bg-bg-dark/80 backdrop-blur-md sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 group" aria-label={t('common:back_to_dashboard')}>
          <span className="font-serif text-2xl font-semibold tracking-wider text-gold-accent group-hover:text-gold-text transition-serene">
            Letters
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="text-xs tracking-widest uppercase font-sans text-zinc-400 hover:text-gold-accent transition-serene flex items-center gap-1.5"
            aria-label={t('common:index')}
          >
            <BookOpen size={13} />
            {t('common:index')}
          </Link>
          <Link
            to="/create"
            className="text-xs tracking-widest uppercase font-sans text-zinc-400 hover:text-gold-accent transition-serene flex items-center gap-1.5"
            aria-label={t('common:write')}
          >
            <PenTool size={13} />
            {t('common:write')}
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs tracking-widest uppercase font-sans text-zinc-500 hover:text-red-400 transition-serene flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
            aria-label={t('common:close')}
          >
            <LogOut size={13} />
            {t('common:close')}
          </button>

          <LanguageSwitcher />
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col py-8 px-4 sm:px-8 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Footnote */}
      <footer className="py-8 text-center text-[10px] tracking-widest uppercase text-zinc-600 border-t border-border-warm/50 mt-12 font-sans">
        {t('common:footer_quote')}
      </footer>
    </div>
  );
}
