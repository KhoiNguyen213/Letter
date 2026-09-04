import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch, getImageUrl } from '../utils/api.js';
import ReactMarkdown from 'react-markdown';
import AudioPlayer from '../components/AudioPlayer.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import ImageGrid from '../components/ImageGrid.jsx';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, EyeOff, Send, CheckCircle, Mail, Key } from 'lucide-react';

// Paragraph animation variants for quiet letter feel
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.8, // 800ms stagger between paragraphs
    }
  }
};

const paragraphVariants = {
  hidden: { 
    opacity: 0, 
    y: 10,
    filter: 'blur(3px)'
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { 
      duration: 1.5, 
      ease: [0.16, 1, 0.3, 1] 
    }
  }
};

export default function SharedLetter() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  
  // Checking states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Lock status screens
  const [sealedDate, setSealedDate] = useState(null); // Time Capsule
  const [alreadyOpened, setAlreadyOpened] = useState(false); // One-Time Opening

  // Unlocked letter content
  const [letter, setLetter] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Reply states
  const [replyText, setReplyText] = useState('');
  const [replySubmitted, setReplySubmitted] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    checkLetterStatus();
  }, [slug]);

  const checkLetterStatus = async () => {
    try {
      const res = await apiFetch(`/share/${slug}`);

      // Handle lockouts
      if (res.status === 'Sealed') {
        setSealedDate(res.unlockDate);
        setLoading(false);
        return;
      }

      if (res.requiresPassword) {
        setRequiresPassword(true);
        setLetter({ recipient: res.recipient }); // At least show whom it is to
        setLoading(false);
        return;
      }

      // If unlocked immediately (no password, not locked, not one-time blocked)
      setLetter(res.letter);
      setIsUnlocked(true);
      setLoading(false);
    } catch (err) {
      if (err.message.includes('403') || err.message.includes('already been opened')) {
        setAlreadyOpened(true);
      } else {
        setError(t('validation:errors.LETTER_NOT_FOUND'));
      }
      setLoading(false);
    }
  };

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setUnlockError(t('share:passcode_error_required'));
      return;
    }

    setUnlockError('');
    try {
      const res = await apiFetch(`/share/${slug}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (res.unlocked) {
        setLetter(res.letter);
        setIsUnlocked(true);
      }
    } catch (err) {
      if (err.message.includes('403') || err.message.includes('already been opened')) {
        setAlreadyOpened(true);
      } else {
        setUnlockError(t('share:passcode_error_incorrect'));
      }
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await apiFetch(`/share/${slug}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText }),
      });
      setReplySubmitted(true);
    } catch (err) {
      alert('Could not submit reply: ' + err.message);
    } finally {
      setSubmittingReply(false);
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

  const openLightbox = (imgs, index = 0) => {
    setLightboxImages(imgs);
    setLightboxIndex(index);
  };

  // Custom components for Markdown rendering (enabling fade-in animations on components)
  const markdownComponents = {
    p: ({ children }) => (
      <motion.p variants={paragraphVariants} className="mb-6 leading-relaxed">
        {children}
      </motion.p>
    ),
    h1: ({ children }) => (
      <motion.h1 variants={paragraphVariants} className="text-2xl font-serif text-gold-accent font-semibold mt-8 mb-4">
        {children}
      </motion.h1>
    ),
    h2: ({ children }) => (
      <motion.h2 variants={paragraphVariants} className="text-xl font-serif text-gold-accent mt-6 mb-3">
        {children}
      </motion.h2>
    ),
    ul: ({ children }) => (
      <motion.ul variants={paragraphVariants} className="list-disc pl-6 mb-6 space-y-2">
        {children}
      </motion.ul>
    ),
    li: ({ children }) => (
      <li className="font-serif">{children}</li>
    ),
    blockquote: ({ children }) => (
      <motion.blockquote variants={paragraphVariants} className="border-l-2 border-gold-accent/40 pl-4 py-1 italic my-6 text-zinc-400">
        {children}
      </motion.blockquote>
    )
  };

  // 1. Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center font-serif italic text-zinc-500">
        {t('share:loading_title')}
      </div>
    );
  }

  // 2. Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="paper-dark p-8 rounded-2xl max-w-sm w-full text-center border border-zinc-900">
          <Lock className="mx-auto text-zinc-700 mb-3" size={24} />
          <h2 className="font-serif text-lg text-zinc-300 mb-2">{t('share:lost_title')}</h2>
          <p className="font-serif italic text-xs text-zinc-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // 3. Time Capsule Sealed screen
  if (sealedDate) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="paper-dark p-8 rounded-2xl max-w-sm w-full text-center border border-amber-950/20">
          <Lock className="mx-auto text-amber-500/70 mb-3 animate-pulse" size={24} />
          <h2 className="font-serif text-lg text-gold-accent mb-2">{t('share:time_capsule_sealed')}</h2>
          <p className="font-serif italic text-xs text-zinc-500 leading-relaxed">
            {t('share:time_capsule_desc')}
          </p>
          <span className="inline-block mt-3 text-xs tracking-wider text-amber-400 bg-amber-950/10 px-3 py-1 rounded border border-amber-950/40">
            {formatDate(sealedDate)}
          </span>
        </div>
      </div>
    );
  }

  // 4. One-Time Opening locked screen
  if (alreadyOpened) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="paper-dark p-8 rounded-2xl max-w-sm w-full text-center border border-red-950/20">
          <EyeOff className="mx-auto text-red-400/60 mb-3" size={24} />
          <h2 className="font-serif text-lg text-zinc-300 mb-2">{t('share:already_opened_title')}</h2>
          <p className="font-serif italic text-xs text-zinc-500 leading-relaxed">
            {t('share:already_opened_desc')}
          </p>
        </div>
      </div>
    );
  }

  const letterImages = letter && (letter.images && letter.images.length > 0 ? letter.images : (letter.coverImage ? [letter.coverImage] : []));

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col justify-center items-center px-4 relative py-12">
      {/* Floating Language Switcher in Reader Page */}
      <div className="absolute top-6 right-8 z-30">
        <LanguageSwitcher />
      </div>

      {/* Decorative candles style ambient backdrop light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-gold-text/3 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* State A: Password Screen (Envelope layout) */}
        {!isUnlocked && requiresPassword && (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.96, transition: { duration: 0.8, ease: 'easeInOut' } }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-8">
              <span className="font-serif italic text-xs text-gold-accent tracking-widest">
                {t('share:envelope_waiting')}
              </span>
              {letter && letter.recipient && (
                <h3 className="font-serif text-lg text-zinc-400 mt-1">{t('share:to_recipient', { name: letter.recipient })}</h3>
              )}
            </div>

            <form 
              onSubmit={handleUnlockSubmit}
              className="paper-dark p-8 rounded-2xl border border-gold-text/10 flex flex-col gap-6 relative"
            >
              {/* Envelope flap aesthetic details */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900 border border-gold-text/10 flex items-center justify-center shadow-lg">
                <Mail size={12} className="text-gold-accent" />
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
                  {t('share:passcode_label')}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('share:passcode_placeholder')}
                    className="w-full bg-bg-dark border border-border-warm rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-gold-text/40 transition-serene font-sans"
                    aria-label={t('share:passcode_label')}
                  />
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                </div>
              </div>

              {unlockError && (
                <p className="text-xs text-red-400 font-serif italic">{unlockError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sm tracking-wider font-serif text-gold-accent border border-gold-text/20 hover:border-gold-text/40 transition-serene focus:outline-none cursor-pointer"
                aria-label={t('share:submit_unlock')}
              >
                {t('share:submit_unlock')}
              </button>
            </form>
          </motion.div>
        )}

        {/* State B: Letter Reading View */}
        {isUnlocked && letter && (
          <motion.div 
            key="reading-screen"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] } }}
            className="w-full max-w-2xl"
          >
            {/* Elegant letter sheet */}
            <div className="letter-page rounded-2xl p-8 md:p-12 min-h-[500px] flex flex-col justify-between relative">
              {/* Vintage watermark styling */}
              <div className="absolute top-8 right-8 w-24 h-24 rounded-full border border-gold-text/5 flex items-center justify-center font-serif text-[10px] uppercase tracking-widest text-gold-text/5 rotate-12 pointer-events-none select-none">
                {t('share:watermark')}
              </div>

              <div>
                {/* Cover / Images Grid */}
                {(letter.coverImage || (letter.images && letter.images.length > 0)) && (
                  <div className="mb-8">
                    <ImageGrid
                      images={letter.images}
                      legacyImage={letter.coverImage}
                      onImageClick={(idx) => openLightbox(letterImages, idx)}
                    />
                  </div>
                )}

                {/* Letter Header */}
                <div className="border-b border-gold-text/10 pb-6 mb-8">
                  <span className="text-xs uppercase tracking-widest text-gold-text font-serif italic font-semibold">
                    {t('share:for_recipient', { name: letter.recipient })}
                  </span>
                  
                  <h1 className="font-serif text-3xl md:text-4xl text-zinc-100 mt-2 font-normal leading-tight">
                    {letter.title || t('dashboard:statuses.draft')}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-3 font-serif italic">
                    <span>{t('share:written_on', { date: formatDate(letter.memoryDate || letter.createdAt) })}</span>
                    {letter.mood && (
                      <>
                        <span>•</span>
                        <span>{t('share:mood', { mood: letter.mood })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Letter Content with soft paragraph reveals */}
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="font-serif text-zinc-300 leading-relaxed text-base md:text-lg space-y-6 markdown-letter prose prose-invert"
                >
                  {letter.content ? (
                    <ReactMarkdown components={markdownComponents}>{letter.content}</ReactMarkdown>
                  ) : (
                    <p className="italic text-zinc-600">{t('share:empty_content')}</p>
                  )}
                </motion.div>
              </div>

              {/* Media players inside the letter */}
              <div className="mt-12 pt-8 border-t border-gold-text/10 flex flex-col gap-3">
                {letter.music && letter.music.url && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">{t('share:music_attached')}</span>
                    <AudioPlayer 
                      url={letter.music.url} 
                      title={letter.music.title} 
                      artist={letter.music.artist} 
                      duration={letter.music.duration} 
                    />
                  </div>
                )}

                {letter.voice && letter.voice.url && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">{t('share:voice_attached')}</span>
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

            {/* Display Received Reply at the bottom if enabled */}
            {letter.oneReply && (
              <div className="mt-8">
                <div className="paper-dark p-6 rounded-2xl border border-border-warm flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium font-sans">
                    {t('share:reply_label')}
                  </span>
                  
                  {replySubmitted ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-serif italic text-sm py-2">
                      <CheckCircle size={16} />
                      {t('share:reply_submitted')}
                    </div>
                  ) : letter.reply ? (
                    <div className="font-serif text-zinc-300 italic p-4 bg-zinc-950/30 rounded-lg border-l-2 border-gold-accent">
                      "{letter.reply}"
                    </div>
                  ) : (
                    <form onSubmit={handleReplySubmit} className="flex flex-col gap-3">
                      <p className="text-xs text-zinc-500 font-serif italic">
                        {t('share:reply_desc')}
                      </p>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('share:reply_placeholder')}
                        rows={3}
                        className="bg-bg-dark border border-border-warm rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene resize-none"
                        aria-label={t('share:reply_placeholder')}
                      />
                      <button
                        type="submit"
                        disabled={submittingReply || !replyText.trim()}
                        className="self-end px-4 py-2 rounded bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 hover:bg-zinc-800 text-xs tracking-wider font-serif text-gold-accent transition-serene focus:outline-none disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                        aria-label={t('share:reply_submit')}
                      >
                        <Send size={11} />
                        {submittingReply ? t('share:reply_sending') : t('share:reply_submit')}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox
        isOpen={lightboxImages.length > 0}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxImages([])}
      />
    </div>
  );
}
