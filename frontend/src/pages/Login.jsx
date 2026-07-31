import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Login() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError(t('auth:error_required'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError(t('auth:error_invalid'));
      }
    } catch (err) {
      if (err.code === 'AUTH_FAILED') {
        setError(t('auth:error_invalid'));
      } else if (err.code === 'SERVER_OFFLINE') {
        setError(t('auth:error_server_offline'));
      } else if (err.code === 'DATABASE_UNAVAILABLE') {
        setError(t('auth:error_db_unavailable'));
      } else if (err.code === 'API_TIMEOUT') {
        setError(t('auth:error_timeout'));
      } else if (err.code === 'CORS_ERROR') {
        setError(t('auth:error_cors'));
      } else {
        setError(t('auth:error_internal'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col justify-center items-center px-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-6 right-8 z-30">
        <LanguageSwitcher />
      </div>

      {/* Decorative Warm Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-gold-text/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl tracking-widest text-gold-accent mb-2">{t('auth:title')}</h1>
          <p className="font-serif italic text-xs text-zinc-500 tracking-wide mt-2">
            {t('common:footer_quote')}
          </p>
        </div>

        {/* Form container styled like a small note card */}
        <form 
          onSubmit={handleSubmit}
          className="paper-dark p-8 rounded-2xl border border-gold-text/10 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium font-sans">
              {t('auth:password_label')}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth:password_placeholder')}
                className="w-full bg-bg-dark border border-border-warm rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-gold-text/40 transition-serene font-sans"
                aria-label={t('auth:password_label')}
              />
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-serif italic">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sm tracking-wider font-serif text-gold-accent border border-gold-text/20 hover:border-gold-text/40 transition-serene focus:outline-none disabled:opacity-50 cursor-pointer"
            aria-label={t('auth:submit_button')}
          >
            {isSubmitting ? t('common:loading') : t('auth:submit_button')}
          </button>
        </form>

        <p className="text-center text-[10px] text-zinc-700 uppercase tracking-wider mt-8 font-sans">
          {t('auth:subtitle')}
        </p>
      </div>
    </div>
  );
}
