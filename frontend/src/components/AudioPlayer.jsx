import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Music, Volume2 } from 'lucide-react';
import { SERVER_BASE } from '../utils/api.js';

export default function AudioPlayer({ url, title, artist, duration }) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Absolute path helper for local uploads
  const audioUrl = url ? (url.startsWith('http') ? url : `${SERVER_BASE}${url}`) : '';

  useEffect(() => {
    // Reset play state if url changes
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log('Audio playback error:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || duration || 1;
    setCurrentTime(current);
    setProgress((current / dur) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const dur = audioRef.current.duration || duration || 0;
    if (dur > 0) {
      const clickTime = (x / width) * dur;
      audioRef.current.currentTime = clickTime;
      setCurrentTime(clickTime);
      setProgress((clickTime / dur) * 100);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="paper-dark p-4 rounded-xl max-w-md w-full my-4 flex items-center gap-4 border border-gold-text/10">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <button
        onClick={togglePlay}
        className="w-12 h-12 rounded-full border border-gold-text/30 flex items-center justify-center text-gold-accent hover:text-gold-text hover:border-gold-text/60 bg-bg-dark/50 transition-serene focus:outline-none cursor-pointer"
        aria-label={isPlaying ? t('common:pause', { defaultValue: 'Pause' }) : t('common:play', { defaultValue: 'Play' })}
      >
        {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current translate-x-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between text-xs text-gold-accent/70 font-medium">
          <span className="truncate flex items-center gap-1 font-serif">
            <Music size={12} />
            {title || t('notification:player.melody_attached')}
          </span>
          {artist && <span className="opacity-60 truncate">{t('editor:by_artist', { artist: artist })}</span>}
        </div>

        {/* Progress Bar */}
        <div 
          onClick={handleProgressClick}
          className="h-1 bg-zinc-800 rounded-full w-full cursor-pointer relative mt-1 overflow-hidden"
          aria-label="Progress bar"
        >
          <div 
            className="h-full bg-gradient-to-r from-gold-accent to-gold-text transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioRef.current?.duration || duration)}</span>
        </div>
      </div>

      {/* Decorative Waveform Anim */}
      <div className="flex items-end gap-0.5 h-6">
        <div className={`wave-bar ${isPlaying ? 'wave-bar-active' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
        <div className={`wave-bar ${isPlaying ? 'wave-bar-active' : 'h-1'}`} style={{ animationDelay: '0.3s' }} />
        <div className={`wave-bar ${isPlaying ? 'wave-bar-active' : 'h-1'}`} style={{ animationDelay: '0.5s' }} />
        <div className={`wave-bar ${isPlaying ? 'wave-bar-active' : 'h-1'}`} style={{ animationDelay: '0.2s' }} />
        <div className={`wave-bar ${isPlaying ? 'wave-bar-active' : 'h-1'}`} style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
