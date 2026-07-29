import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Square, RotateCcw, Play, Pause, Trash2, Check } from 'lucide-react';
import { SERVER_BASE } from '../utils/api.js';


export default function VoiceRecorder({ onRecordComplete, onClear, initialVoiceUrl }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(initialVoiceUrl || null);
  const [duration, setDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioPreviewRef = useRef(null);

  useEffect(() => {
    setAudioUrl(initialVoiceUrl || null);
    if (!initialVoiceUrl) {
      setDuration(0);
    }
  }, [initialVoiceUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    if (!initialVoiceUrl) setAudioUrl(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);

        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      console.error('Error starting voice recording:', err);
      alert(t('notification:voice.microphone_error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const togglePreview = () => {
    if (!audioPreviewRef.current) return;

    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handlePreviewEnded = () => {
    setIsPlayingPreview(false);
  };

  const handleClear = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsRecording(false);
    setIsPlayingPreview(false);
    if (onClear) onClear();
  };

  const handleSave = () => {
    if (audioBlob) {
      onRecordComplete(audioBlob, duration);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="paper-dark p-4 rounded-xl border border-gold-text/10 max-w-sm w-full my-2">
      <h4 className="text-xs font-serif text-gold-accent mb-2">{t('notification:voice.record_title')}</h4>
      
      {audioUrl && (
        <audio 
          ref={audioPreviewRef} 
          src={audioUrl.startsWith('blob:') || audioUrl.startsWith('http') ? audioUrl : `${SERVER_BASE}${audioUrl}`} 
          onEnded={handlePreviewEnded}
          onLoadedMetadata={(e) => {
            if (e.target.duration && isFinite(e.target.duration)) {
              setDuration(Math.round(e.target.duration));
            }
          }}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        {/* State 1: Ready to Record or Recording */}
        {!audioUrl && (
          <div className="flex items-center gap-4 w-full justify-between">
            {isRecording ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-sm text-zinc-300">{formatTime(duration)}</span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-serif text-zinc-300 flex items-center gap-1 border border-zinc-700 cursor-pointer"
                  aria-label={t('notification:voice.stop_button')}
                >
                  <Square size={12} />
                  {t('notification:voice.stop_button')}
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-zinc-500">{t('notification:voice.attach_desc')}</span>
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-serif text-gold-accent flex items-center gap-1.5 border border-gold-text/20 transition-serene cursor-pointer"
                  aria-label={t('notification:voice.start_button')}
                >
                  <Mic size={12} />
                  {t('notification:voice.start_button')}
                </button>
              </>
            )}
          </div>
        )}

        {/* State 2: Recorded & Ready to Preview / Save */}
        {audioUrl && !isRecording && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreview}
                className="w-8 h-8 rounded-full border border-gold-text/20 flex items-center justify-center text-gold-accent hover:border-gold-text/40 bg-zinc-900 cursor-pointer"
                aria-label={isPlayingPreview ? 'Pause' : 'Play'}
              >
                {isPlayingPreview ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5" />}
              </button>
              <span className="text-xs text-zinc-400 font-mono">{duration > 0 ? formatTime(duration) : t('notification:voice.recorded')}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-red-400/80 hover:text-red-400 border border-zinc-800 cursor-pointer"
                title={t('notification:voice.discard_tooltip')}
                aria-label={t('notification:voice.discard_tooltip')}
              >
                <Trash2 size={14} />
              </button>

              {audioBlob && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs text-gold-accent border border-gold-text/30 flex items-center gap-1 cursor-pointer"
                  aria-label={t('notification:voice.apply_button')}
                >
                  <Check size={12} />
                  {t('notification:voice.apply_button')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
