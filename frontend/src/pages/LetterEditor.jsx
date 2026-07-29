import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, uploadFile, SERVER_BASE } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import VoiceRecorder from '../components/VoiceRecorder.jsx';
import { useTranslation } from 'react-i18next';
import { Save, FileText, ArrowLeft, Image as ImageIcon, Music as MusicIcon, Calendar, Lock, Eye, EyeOff, CheckCircle, HelpCircle } from 'lucide-react';

export default function LetterEditor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null, 'not_found', 'error'

  // Inputs state
  const [recipient, setRecipient] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  
  // Advanced features state
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [unlockDate, setUnlockDate] = useState('');
  const [oneTimeOpening, setOneTimeOpening] = useState(false);
  const [oneReply, setOneReply] = useState(false);

  // File states (metadata from server)
  const [coverImage, setCoverImage] = useState('');
  const [music, setMusic] = useState(null);
  const [voice, setVoice] = useState(null);

  // Music upload helper state
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');

  // Autosave tracking state: uses keys: 'initial', 'saving', 'saved', 'error'
  const [saveStatus, setSaveStatus] = useState('initial'); 
  const isInitialLoad = useRef(true);

  // Load letter data
  useEffect(() => {
    let active = true;
    const loadLetter = async () => {
      try {
        setLoading(true);
        setError(null);
        const letter = await apiFetch(`/letters/${id}`);
        if (!active) return;

        setRecipient(letter.recipient || '');
        setTitle(letter.title || '');
        setContent(letter.content || '');
        setMood(letter.mood || '');
        setTagsString(letter.tags ? letter.tags.join(', ') : '');
        setMemoryDate(letter.memoryDate ? letter.memoryDate.split('T')[0] : '');
        
        setCoverImage(letter.coverImage || '');
        setMusic(letter.music || null);
        setVoice(letter.voice || null);

        if (letter.music) {
          setMusicTitle(letter.music.title || '');
          setMusicArtist(letter.music.artist || '');
        }

        if (letter.unlockDate) {
          setIsTimeCapsule(true);
          setUnlockDate(letter.unlockDate.split('T')[0]);
        }
        setOneTimeOpening(letter.oneTimeOpening || false);
        setOneReply(letter.oneReply || false);
        
        isInitialLoad.current = false;
        setLoading(false);
      } catch (err) {
        console.error('Error loading letter:', err);
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

    loadLetter();
    return () => {
      active = false;
    };
  }, [id]);

  // Unified save function
  const saveLetterData = useCallback(async (customPayload = null) => {
    if (loading || error) return;
    setSaveStatus('saving');
    try {
      const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
      
      const payload = customPayload || {
        recipient,
        title,
        content,
        mood,
        tags,
        memoryDate: memoryDate || null,
        unlockDate: isTimeCapsule && unlockDate ? new Date(unlockDate) : null,
        oneTimeOpening,
        oneReply,
      };

      await apiFetch(`/letters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSaveStatus('saved');
    } catch (err) {
      console.error('Autosave error:', err);
      setSaveStatus('error');
    }
  }, [id, recipient, title, content, mood, tagsString, memoryDate, isTimeCapsule, unlockDate, oneTimeOpening, oneReply, loading, error]);

  // Debounced autosave triggers when content / fields change
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (loading || error) return;
    
    setSaveStatus('saving');
    const delayDebounce = setTimeout(() => {
      saveLetterData();
    }, 1800);

    return () => clearTimeout(delayDebounce);
  }, [recipient, title, content, mood, tagsString, memoryDate, isTimeCapsule, unlockDate, oneTimeOpening, oneReply, saveLetterData, loading, error]);

  // Handle Cover Photo Upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaveStatus('saving');
    try {
      const res = await uploadFile(file);
      setCoverImage(res.url);
      
      // Save directly to db
      await apiFetch(`/letters/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ coverImage: res.url }),
      });
      setSaveStatus('saved');
    } catch (err) {
      alert(t('editor:upload_cover_error') + err.message);
      setSaveStatus('error');
    }
  };

  // Helper to load file and extract audio duration in browser
  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
    });
  };

  // Handle Background Music Upload
  const handleMusicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaveStatus('saving');
    try {
      const duration = await getAudioDuration(file);
      const res = await uploadFile(file, musicTitle || file.name, musicArtist || 'Unknown Artist', duration);
      
      const musicObj = {
        url: res.url,
        title: res.title,
        artist: res.artist,
        duration: res.duration,
        fileSize: res.fileSize,
      };
      
      setMusic(musicObj);

      await apiFetch(`/letters/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ music: musicObj }),
      });
      setSaveStatus('saved');
    } catch (err) {
      alert(t('editor:upload_music_error') + err.message);
      setSaveStatus('error');
    }
  };

  // Handle Voice Recording Submission
  const handleVoiceRecordComplete = async (blob, duration) => {
    setSaveStatus('saving');
    try {
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      const res = await uploadFile(file, 'Voice Reflection', 'Owner', duration);

      const voiceObj = {
        url: res.url,
        duration: res.duration,
        fileSize: res.fileSize,
      };

      setVoice(voiceObj);

      await apiFetch(`/letters/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ voice: voiceObj }),
      });
      setSaveStatus('saved');
    } catch (err) {
      alert(t('editor:upload_music_error') + err.message);
      setSaveStatus('error');
    }
  };

  // Discard attachments
  const removeAttachment = async (type) => {
    setSaveStatus('saving');
    try {
      const updates = {};
      if (type === 'cover') {
        updates.coverImage = null;
        setCoverImage('');
      } else if (type === 'music') {
        updates.music = null;
        setMusic(null);
      } else if (type === 'voice') {
        updates.voice = null;
        setVoice(null);
      }

      await apiFetch(`/letters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center font-serif italic text-zinc-500 gap-4">
          <div className="w-6 h-6 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
          {t('editor:loading_title')}
        </div>
      </OwnerLayout>
    );
  }

  if (error === 'not_found') {
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

  const getSaveStatusColorClass = () => {
    if (saveStatus === 'error') return 'bg-red-400';
    if (saveStatus === 'saving') return 'bg-amber-400 animate-pulse';
    return 'bg-emerald-400';
  };

  return (
    <OwnerLayout>
      {/* Save status indicators */}
      <div className="flex items-center justify-between border-b border-border-warm pb-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-zinc-500 hover:text-gold-accent flex items-center gap-1.5 transition-serene cursor-pointer"
          aria-label={t('common:back_to_index')}
        >
          <ArrowLeft size={12} />
          {t('common:back_to_index')}
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${getSaveStatusColorClass()}`} />
          <span className="text-zinc-500 font-sans italic">{t('editor:status_' + saveStatus)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Recipient & Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('editor:to_label')}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t('editor:to_placeholder')}
              className="bg-bg-paper border border-border-warm rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene"
              aria-label={t('editor:to_label')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('editor:title_label')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('editor:title_placeholder')}
              className="bg-bg-paper border border-border-warm rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene"
              aria-label={t('editor:title_label')}
            />
          </div>
        </div>

        {/* Content Markdown Area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
            {t('editor:content_label')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('editor:content_placeholder')}
            rows={12}
            className="bg-bg-paper border border-border-warm rounded-lg p-4 text-base font-serif leading-relaxed text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene resize-y"
            aria-label={t('editor:content_label')}
          />
        </div>

        {/* Mood & Tags & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('editor:mood_label')}
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder={t('editor:mood_placeholder')}
              className="bg-bg-paper border border-border-warm rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene"
              aria-label={t('editor:mood_label')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('editor:tags_label')}
            </label>
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder={t('editor:tags_placeholder')}
              className="bg-bg-paper border border-border-warm rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene"
              aria-label={t('editor:tags_label')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              {t('editor:memory_date_label')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full bg-bg-paper border border-border-warm rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer"
                aria-label={t('editor:memory_date_label')}
              />
            </div>
          </div>
        </div>

        {/* Media Attachments Section */}
        <div className="border-t border-border-warm/50 pt-6">
          <h3 className="font-serif text-lg text-zinc-300 mb-4">{t('editor:elements_title')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Image and Music Upload */}
            <div className="flex flex-col gap-5">
              {/* Cover Image Upload */}
              <div className="paper-dark p-4 rounded-xl border border-gold-text/5 flex flex-col gap-3">
                <span className="text-xs font-serif text-gold-accent flex items-center gap-1.5">
                  <ImageIcon size={13} /> {t('editor:cover_image_title')}
                </span>
                
                {coverImage ? (
                  <div className="relative rounded-lg overflow-hidden h-24 border border-border-warm">
                    <img 
                      src={coverImage.startsWith('http') ? coverImage : `${SERVER_BASE}${coverImage}`} 
                      alt="Cover" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment('cover')}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-red-400 hover:text-red-300 text-[10px] uppercase px-2 py-1 rounded tracking-wider cursor-pointer"
                      aria-label={`${t('editor:remove')} ${t('editor:cover_image_title')}`}
                    >
                      {t('editor:remove')}
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-border-warm hover:border-gold-text/20 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-serene">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{t('editor:select_cover_photo')}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleCoverUpload} 
                      className="hidden" 
                      aria-label={t('editor:select_cover_photo')}
                    />
                  </label>
                )}
              </div>

              {/* Music Upload */}
              <div className="paper-dark p-4 rounded-xl border border-gold-text/5 flex flex-col gap-3">
                <span className="text-xs font-serif text-gold-accent flex items-center gap-1.5">
                  <MusicIcon size={13} /> {t('editor:melody_title')}
                </span>

                {music ? (
                  <div className="flex items-center justify-between bg-zinc-950/20 p-2.5 rounded-lg border border-border-warm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-serif text-zinc-300 truncate">{music.title}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{t('editor:by_artist', { artist: music.artist || 'Unknown' })}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment('music')}
                      className="text-red-400/80 hover:text-red-400 text-[10px] uppercase px-2 py-1 cursor-pointer"
                      aria-label={`${t('editor:remove')} ${t('editor:melody_title')}`}
                    >
                      {t('editor:remove')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder={t('editor:song_title_placeholder')} 
                        value={musicTitle}
                        onChange={(e) => setMusicTitle(e.target.value)}
                        className="bg-bg-dark border border-border-warm rounded p-2 text-[10px] text-zinc-400 focus:outline-none"
                        aria-label={t('editor:song_title_placeholder')}
                      />
                      <input 
                        type="text" 
                        placeholder={t('editor:artist_placeholder')} 
                        value={musicArtist}
                        onChange={(e) => setMusicArtist(e.target.value)}
                        className="bg-bg-dark border border-border-warm rounded p-2 text-[10px] text-zinc-400 focus:outline-none"
                        aria-label={t('editor:artist_placeholder')}
                      />
                    </div>
                    <label className="border border-dashed border-border-warm hover:border-gold-text/20 rounded-lg py-4 flex flex-col items-center justify-center cursor-pointer transition-serene">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t('editor:upload_audio_placeholder')}</span>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleMusicUpload} 
                        className="hidden" 
                        aria-label={t('editor:upload_audio_placeholder')}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Voice Note browser recording */}
            <div className="flex flex-col justify-start">
              <VoiceRecorder
                onRecordComplete={handleVoiceRecordComplete}
                onClear={() => removeAttachment('voice')}
                initialVoiceUrl={voice?.url}
              />
            </div>
          </div>
        </div>

        {/* Quiet Custom Locking Features (Time Capsule, One-Time Opening, One Reply) */}
        <div className="border-t border-border-warm/50 pt-6">
          <h3 className="font-serif text-lg text-zinc-300 mb-4 font-medium">{t('editor:seal_rules_title')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Time Capsule Lock */}
            <div className="paper-dark p-5 rounded-xl border border-gold-text/5 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTimeCapsule}
                  onChange={(e) => {
                    setIsTimeCapsule(e.target.checked);
                    if (!e.target.checked) setUnlockDate('');
                  }}
                  className="rounded bg-bg-dark border-border-warm text-gold-accent focus:ring-0 focus:ring-offset-0"
                  aria-label={t('editor:time_capsule_label')}
                />
                <span className="text-xs font-serif text-gold-accent flex items-center gap-1">
                  <Lock size={12} /> {t('editor:time_capsule_label')}
                </span>
              </label>
              
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {t('editor:time_capsule_desc')}
              </p>

              {isTimeCapsule && (
                <input
                  type="date"
                  value={unlockDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="bg-bg-dark border border-border-warm rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-gold-text/30"
                  aria-label="Unlock Date"
                />
              )}
            </div>

            {/* One-Time Opening */}
            <div className="paper-dark p-5 rounded-xl border border-gold-text/5 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneTimeOpening}
                  onChange={(e) => setOneTimeOpening(e.target.checked)}
                  className="rounded bg-bg-dark border-border-warm text-gold-accent focus:ring-0 focus:ring-offset-0"
                  aria-label={t('editor:one_time_opening_label')}
                />
                <span className="text-xs font-serif text-gold-accent flex items-center gap-1">
                  <EyeOff size={12} /> {t('editor:one_time_opening_label')}
                </span>
              </label>

              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {t('editor:one_time_opening_desc')}
              </p>
            </div>

            {/* One Reply */}
            <div className="paper-dark p-5 rounded-xl border border-gold-text/5 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneReply}
                  onChange={(e) => setOneReply(e.target.checked)}
                  className="rounded bg-bg-dark border-border-warm text-gold-accent focus:ring-0 focus:ring-offset-0"
                  aria-label={t('editor:one_reply_label')}
                />
                <span className="text-xs font-serif text-gold-accent flex items-center gap-1">
                  <CheckCircle size={12} /> {t('editor:one_reply_label')}
                </span>
              </label>

              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {t('editor:one_reply_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* View Details Action Button */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => navigate(`/view/${id}`)}
            className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 hover:bg-zinc-800 text-sm tracking-wider font-serif text-gold-accent transition-serene focus:outline-none cursor-pointer"
            aria-label={t('editor:review_button')}
          >
            {t('editor:review_button')}
          </button>
        </div>
      </div>
    </OwnerLayout>
  );
}
