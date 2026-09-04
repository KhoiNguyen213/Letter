import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, SERVER_BASE } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import ReactMarkdown from 'react-markdown';
import AudioPlayer from '../components/AudioPlayer.jsx';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Share2, EyeOff, Calendar, AlertCircle, Copy, Check, RotateCcw, Heart, Eye } from 'lucide-react';

function SharePasswordModal({ isOpen, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError(t('viewer:error_password_required'));
      return;
    }

    if (password.length < 6 || password.length > 64) {
      setError(t('viewer:error_password_length'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('viewer:error_passwords_match'));
      return;
    }

    onSubmit(password);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphism backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="paper-dark w-full max-w-md rounded-2xl border border-gold-text/10 p-6 relative z-10 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
        <div>
          <h3 className="font-serif text-lg text-gold-accent font-medium">
            {t('viewer:share_modal_title')}
          </h3>
          <p className="text-[10px] text-zinc-500 font-sans mt-1 uppercase tracking-wider">
            Define password for sealing this letter
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Share Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('viewer:share_password_label')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-bg-dark border border-border-warm rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene font-sans"
              aria-label={t('viewer:share_password_label')}
              autoFocus
            />
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('viewer:confirm_password_label')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-bg-dark border border-border-warm rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene font-sans"
              aria-label={t('viewer:confirm_password_label')}
            />
          </div>

          {/* Show Password Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer self-start">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded bg-bg-dark border-border-warm text-gold-accent focus:ring-0 focus:ring-offset-0"
              aria-label={t('viewer:show_password')}
            />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans font-medium">
              {t('viewer:show_password')}
            </span>
          </label>

          {error && (
            <p className="text-xs text-red-400 font-serif italic mt-1">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-2 border-t border-border-warm/40 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-border-warm text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 font-sans transition-serene cursor-pointer"
            >
              {t('viewer:cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 text-xs uppercase tracking-wider text-gold-accent font-sans transition-serene cursor-pointer"
            >
              {t('viewer:seal_share')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LetterViewer() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null, 'not_found', 'error'
  const [plainPassword, setPlainPassword] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchLetter = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch(`/letters/${id}`);
        if (!active) return;
        setLetter(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching letter:', err);
        if (!active) return;
        const msg = err.message || '';
        if (msg.includes('not found') || msg.includes('404') || msg.includes('CastError') || msg.includes('Invalid letter ID format') || msg.includes('400')) {
          setError('not_found');
        } else {
          setError('error');
        }
        setLoading(false);
      }
    };

    fetchLetter();
    return () => {
      active = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(t('viewer:delete_confirm'))) {
      return;
    }

    try {
      await apiFetch(`/letters/${id}`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (err) {
      alert(t('viewer:delete_error'));
    }
  };

  const handleShare = async (password) => {
    try {
      const res = await apiFetch(`/letters/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setLetter(res.letter);
      setPlainPassword(res.plainPassword); // Display once
    } catch (err) {
      alert(t('viewer:share_error'));
    }
  };

  const handleUnshare = async () => {
    if (!window.confirm(t('viewer:unshare_confirm'))) {
      return;
    }

    try {
      const updated = await apiFetch(`/letters/${id}/unshare`, { method: 'POST' });
      setLetter(updated);
      setPlainPassword('');
    } catch (err) {
      alert(t('viewer:unshare_error'));
    }
  };

  const toggleFavorite = async () => {
    try {
      const updated = await apiFetch(`/letters/${id}/favorite`, { method: 'POST' });
      setLetter({ ...letter, isFavorite: updated.isFavorite });
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('dashboard:undated');
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatNumber = (num) => {
    if (num == null) return '0';
    return new Intl.NumberFormat(i18n.language).format(num);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(kb)} KB`;
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center font-serif italic text-zinc-500 gap-4">
          <div className="w-6 h-6 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
          {t('viewer:loading_title')}
        </div>
      </OwnerLayout>
    );
  }

  if (error === 'not_found' || !letter) {
    return (
      <OwnerLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
          <div className="paper-dark p-8 rounded-2xl max-w-md text-center border border-red-500/20">
            <h2 className="text-xl font-serif text-zinc-200 mb-2">{t('validation:errors.LETTER_NOT_FOUND')}</h2>
            <p className="text-sm text-zinc-400 font-serif italic mb-6">
              {t('validation:errors.GENERIC_ERROR')}
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 hover:bg-zinc-800 text-xs tracking-widest font-serif text-gold-accent uppercase transition-serene cursor-pointer"
            >
              {t('common:back_to_dashboard')}
            </button>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  if (error) {
    return (
      <OwnerLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
          <div className="paper-dark p-8 rounded-2xl max-w-md text-center border border-red-500/20">
            <h2 className="text-xl font-serif text-zinc-200 mb-2">{t('editor:status_error')}</h2>
            <p className="text-sm text-zinc-400 font-serif italic mb-6">
              {t('validation:errors.GENERIC_ERROR')}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 hover:bg-zinc-800 text-xs tracking-widest font-serif text-gold-accent uppercase transition-serene cursor-pointer"
              >
                {t('common:retry')}
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 hover:bg-zinc-800 text-xs tracking-widest font-serif text-gold-accent uppercase transition-serene cursor-pointer"
              >
                {t('common:back_to_dashboard')}
              </button>
            </div>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  const shareUrl = `${window.location.origin}/letter/${letter.shareSlug}`;

  return (
    <OwnerLayout>
      <div className="flex flex-col gap-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-warm pb-4">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${
              letter.status === 'Draft' ? 'text-zinc-500 border-zinc-800' :
              letter.status === 'Sealed' ? 'text-amber-500 border-amber-950/40' : 'text-emerald-500 border-emerald-950/40'
            }`}>
              {t('dashboard:status_tags.' + letter.status)}
            </span>

            {/* Opened Count Display */}
            {letter.openedCount > 0 && (
              <span className="text-[10px] text-zinc-500 font-sans flex items-center gap-1">
                <Eye size={10} />
                {t('viewer:opened_count', { count: formatNumber(letter.openedCount), defaultValue: `Read ${formatNumber(letter.openedCount)} times` })}
              </span>
            )}

            {letter.unlockDate && new Date(letter.unlockDate) > new Date() && (
              <span className="text-[9px] text-amber-500/80 font-sans tracking-wide">
                {t('dashboard:capsule')}
              </span>
            )}
            
            <button
              onClick={toggleFavorite}
              className="text-zinc-500 hover:text-gold-accent transition-serene p-1 cursor-pointer"
              title="Toggle Favorite"
            >
              <Heart size={16} className={letter.isFavorite ? 'fill-gold-text text-gold-text' : ''} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/letters')}
              className="px-3 py-1.5 bg-zinc-900 border border-border-warm rounded text-xs text-zinc-400 hover:text-gold-accent flex items-center gap-1 transition-serene cursor-pointer"
            >
              ← Quay lại
            </button>

            <button
              onClick={() => navigate(`/letters/edit/${letter._id}`)}
              className="px-3.5 py-1.5 bg-zinc-900 border border-border-warm rounded text-xs text-zinc-400 hover:text-gold-accent hover:border-gold-text/20 flex items-center gap-1 transition-serene cursor-pointer"
              aria-label={t('viewer:edit_letter')}
            >
              <Edit2 size={12} />
              {t('viewer:edit_letter')}
            </button>
            
            {['Shared', 'Sealed'].includes(letter.status) ? (
              <button
                onClick={handleUnshare}
                className="px-3.5 py-1.5 bg-zinc-950 border border-red-950/30 rounded text-xs text-red-400 hover:bg-red-950/10 flex items-center gap-1 transition-serene cursor-pointer"
                aria-label={t('viewer:unshare')}
              >
                <EyeOff size={12} />
                {t('viewer:unshare')}
              </button>
            ) : (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-1.5 bg-zinc-900 border border-gold-text/20 rounded text-xs text-gold-accent hover:bg-zinc-850 hover:border-gold-text/40 flex items-center gap-1 transition-serene cursor-pointer"
                aria-label={t('viewer:seal_share')}
              >
                <Share2 size={12} />
                {t('viewer:seal_share')}
              </button>
            )}

            <button
              onClick={handleDelete}
              className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-xs text-zinc-600 hover:text-red-400 hover:border-red-900/30 flex items-center gap-1 transition-serene cursor-pointer"
              aria-label={t('viewer:delete')}
            >
              <Trash2 size={12} />
              {t('viewer:delete')}
            </button>
          </div>
        </div>

        {/* Sharing Details (Alert container showing Slug and One-time Passcode) */}
        {['Shared', 'Sealed'].includes(letter.status) && (
          <div className="paper-dark p-6 rounded-2xl border border-gold-text/20 flex flex-col gap-4 bg-zinc-950/20">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-gold-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gold-accent font-sans font-medium">{t('viewer:share_alert_title')}</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  {t('viewer:share_alert_desc')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 border-t border-border-warm/40 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-sans">{t('viewer:shareable_link')}</span>
                <div className="flex items-center gap-2 bg-bg-dark border border-border-warm rounded-lg p-2.5">
                  <span className="text-xs text-zinc-400 truncate flex-1 font-mono">{shareUrl}</span>
                  <button 
                    onClick={() => copyToClipboard(shareUrl, 'link')}
                    className="text-zinc-500 hover:text-gold-accent p-1 transition-serene cursor-pointer"
                    aria-label="Copy Shareable Link"
                  >
                    {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-sans">{t('viewer:letter_passcode')}</span>
                {plainPassword ? (
                  <div className="flex items-center gap-2 bg-bg-dark border border-gold-text/20 rounded-lg p-2.5">
                    <span className="text-xs text-gold-accent font-mono flex-1 font-semibold">{plainPassword}</span>
                    <button 
                      onClick={() => copyToClipboard(plainPassword, 'pass')}
                      className="text-zinc-500 hover:text-gold-accent p-1 transition-serene cursor-pointer"
                      aria-label="Copy Letter Passcode"
                    >
                      {copiedPass ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-bg-dark border border-border-warm rounded-lg p-2.5">
                    <span className="text-xs text-zinc-600 italic">{t('viewer:password_hidden')}</span>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="text-[9px] uppercase tracking-wider text-gold-accent hover:text-gold-text font-sans flex items-center gap-1 cursor-pointer"
                      aria-label={t('viewer:regenerate')}
                    >
                      <RotateCcw size={10} />
                      {t('viewer:regenerate')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {plainPassword && (
              <div className="text-[10px] text-zinc-500 font-serif italic border-l-2 border-gold-accent/40 pl-3 py-1 mt-1 bg-gold-text/2">
                ⚠️ {t('viewer:warning_write_passcode')}
              </div>
            )}
          </div>
        )}

        {/* Outer Page Book Styling */}
        <div className="w-full max-w-2xl mx-auto mt-6">
          <div className="letter-page rounded-2xl p-8 md:p-12 min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            {/* Vintage watermark styling */}
            <div className="absolute top-8 right-8 w-24 h-24 rounded-full border border-gold-text/5 flex items-center justify-center font-serif text-[10px] uppercase tracking-widest text-gold-text/5 rotate-12 pointer-events-none select-none">
              {t('viewer:watermark')}
            </div>

            <div>
              {/* Cover Image */}
              {letter.coverImage && (
                <div className="rounded-xl overflow-hidden max-h-[300px] mb-8 border border-gold-text/10">
                  <img 
                    src={letter.coverImage.startsWith('http') ? letter.coverImage : `${SERVER_BASE}${letter.coverImage}`} 
                    alt="Cover" 
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
              )}

              {/* Letter Header */}
              <div className="border-b border-gold-text/10 pb-6 mb-8">
                <span className="text-xs uppercase tracking-widest text-gold-text font-serif italic font-semibold">
                  {t('viewer:for_recipient', { name: letter.recipient })}
                </span>
                
                <h1 className="font-serif text-3xl md:text-4xl text-zinc-100 mt-2 font-normal leading-tight">
                  {letter.title || t('dashboard:statuses.draft')}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-3 font-serif italic">
                  <span>{t('viewer:written_on', { date: formatDate(letter.memoryDate || letter.createdAt) })}</span>
                  {letter.mood && (
                    <>
                      <span>•</span>
                      <span>{t('viewer:mood', { mood: letter.mood })}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Letter Content */}
              <div className="font-serif text-zinc-300 leading-relaxed text-base md:text-lg space-y-6 markdown-letter prose prose-invert">
                {letter.content ? (
                  <ReactMarkdown>{letter.content}</ReactMarkdown>
                ) : (
                  <p className="italic text-zinc-600">{t('viewer:empty_content')}</p>
                )}
              </div>
            </div>

            {/* Media players inside the letter */}
            <div className="mt-12 pt-8 border-t border-gold-text/10 flex flex-col gap-3">
              {letter.music && letter.music.url && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">{t('viewer:music_attached')}</span>
                  <AudioPlayer 
                    url={letter.music.url} 
                    title={letter.music.title + (letter.music.fileSize ? ` (${formatFileSize(letter.music.fileSize)})` : '')} 
                    artist={letter.music.artist} 
                    duration={letter.music.duration} 
                  />
                </div>
              )}

              {letter.voice && letter.voice.url && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">{t('viewer:voice_attached')}</span>
                  <AudioPlayer 
                    url={letter.voice.url} 
                    title={t('notification:player.spoken_memory')} 
                    artist={t('notification:player.owner')} 
                    duration={letter.voice.duration} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Display Received Reply at the bottom if enabled */}
        {letter.oneReply && (
          <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="paper-dark p-6 rounded-2xl border border-border-warm flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium font-sans">
                {t('viewer:reply_section')}
              </span>
              {letter.reply ? (
                <div className="font-serif text-zinc-300 italic p-4 bg-zinc-950/30 rounded-lg border-l-2 border-gold-accent">
                  "{letter.reply}"
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-serif italic">
                  {t('viewer:no_reply_yet')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <SharePasswordModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={handleShare}
      />
    </OwnerLayout>
  );
}
