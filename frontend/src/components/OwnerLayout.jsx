import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, BookOpen, Mail, Calendar, StickyNote, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function OwnerLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Trang chủ', icon: BookOpen },
    { path: '/letters', label: 'Lá thư', icon: Mail },
    { path: '/diary', label: 'Nhật ký', icon: Calendar },
    { path: '/notes', label: 'Ghi chú', icon: StickyNote },
    { path: '/ai', label: 'Góc AI', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Quiet Elegant Header */}
      <header className="border-b border-border-warm py-4 px-4 sm:px-8 flex items-center justify-between bg-bg-dark/80 backdrop-blur-md sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 group" aria-label="Letter Home">
          <span className="font-serif text-2xl font-semibold tracking-wider text-gold-accent group-hover:text-gold-text transition-serene">
            Letter
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-sans hidden sm:inline-block border-l border-zinc-800 pl-2">
            Private Space
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 sm:gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs tracking-widest font-sans transition-serene flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  isActive
                    ? 'text-gold-accent bg-zinc-900 border border-gold-text/20 font-medium'
                    : 'text-zinc-400 hover:text-gold-accent hover:bg-zinc-900/50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-gold-accent' : 'text-zinc-500'} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          <button
            onClick={handleLogout}
            className="text-xs tracking-widest font-sans text-zinc-500 hover:text-red-400 transition-serene flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-900/50 border-none cursor-pointer"
            title="Đăng xuất"
            aria-label="Logout"
          >
            <LogOut size={14} />
            <span className="hidden lg:inline">Thoát</span>
          </button>

          <LanguageSwitcher />
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col py-8 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Quiet Footnote */}
      <footer className="py-6 text-center text-[10px] tracking-widest uppercase text-zinc-600 border-t border-border-warm/40 mt-12 font-sans">
        Không gian riêng tư số — Only For You
      </footer>
    </div>
  );
}
