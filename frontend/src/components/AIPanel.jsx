import React, { useState } from 'react';
import { apiFetch } from '../utils/api.js';
import { Sparkles, X, RefreshCw, Copy, Check, Lightbulb, HelpCircle, FileText, Wand2, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AIPanel({ isOpen, onClose, initialContent = '', contextType = 'general', title = '', recipient = '', mood = '' }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [currentAction, setCurrentAction] = useState('');

  if (!isOpen) return null;

  const handleAIAction = async (action) => {
    setLoading(true);
    setError('');
    setAiResponse('');
    setCurrentAction(action);

    try {
      const data = await apiFetch('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          action,
          content: initialContent,
          contextType,
          title,
          recipient,
          mood,
        }),
      });

      if (data.result) {
        setAiResponse(data.result);
      } else {
        setError(t('ai:error_no_result', 'Không nhận được phản hồi từ AI.'));
      }
    } catch (err) {
      console.error('AI Request error:', err);
      setError(err.message || t('ai:error_generic', 'Có lỗi xảy ra khi kết nối với Gemini AI.'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-bg-dark border-l border-border-warm h-full flex flex-col shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-warm/60 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-gold-accent" size={18} />
            <h2 className="font-serif text-lg text-zinc-100 font-medium">Gemini Private Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-full hover:bg-zinc-800/50 transition-serene"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security / Privacy notice */}
        <div className="paper-dark p-3.5 rounded-xl border border-gold-text/10 mb-6 text-xs text-zinc-400 font-sans leading-relaxed">
          🔒 <span className="text-zinc-200 font-medium">Bảo mật riêng tư:</span> Nội dung chỉ được gửi đến Gemini khi bạn bấm nút phản hồi bên dưới. Dữ liệu của bạn được bảo mật tuyệt đối và không lưu trữ công khai.
        </div>

        {/* AI Actions Buttons */}
        <div className="flex flex-col gap-2.5 mb-6">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium font-sans">
            Chọn hành động AI:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAIAction('analyze')}
              disabled={loading || !initialContent.trim()}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-gold-text/15 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene text-left disabled:opacity-40"
            >
              <Wand2 size={13} className="text-gold-accent flex-shrink-0" />
              <span>Phân tích cảm xúc</span>
            </button>

            <button
              onClick={() => handleAIAction('summarize')}
              disabled={loading || !initialContent.trim()}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-gold-text/15 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene text-left disabled:opacity-40"
            >
              <FileText size={13} className="text-gold-accent flex-shrink-0" />
              <span>Tóm tắt ý chính</span>
            </button>

            <button
              onClick={() => handleAIAction('improve')}
              disabled={loading || !initialContent.trim()}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-gold-text/15 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene text-left disabled:opacity-40"
            >
              <Sparkles size={13} className="text-gold-accent flex-shrink-0" />
              <span>Cải thiện văn phong</span>
            </button>

            <button
              onClick={() => handleAIAction('questions')}
              disabled={loading || !initialContent.trim()}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-gold-text/15 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene text-left disabled:opacity-40"
            >
              <HelpCircle size={13} className="text-gold-accent flex-shrink-0" />
              <span>Câu hỏi tự vấn</span>
            </button>

            <button
              onClick={() => handleAIAction('extract')}
              disabled={loading || !initialContent.trim()}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-gold-text/15 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene text-left disabled:opacity-40"
            >
              <Lightbulb size={13} className="text-gold-accent flex-shrink-0" />
              <span>Trích xuất ghi nhớ</span>
            </button>

            <button
              onClick={() => handleAIAction('prompts')}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-gold-text/15 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene text-left disabled:opacity-40"
            >
              <Compass size={13} className="text-gold-accent flex-shrink-0" />
              <span>Gợi ý chủ đề viết</span>
            </button>
          </div>
        </div>

        {/* Loading status */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw size={24} className="text-gold-accent animate-spin mb-3" />
            <p className="font-serif italic text-sm text-zinc-400">Đang kết nối an toàn với Gemini AI...</p>
            <span className="text-[10px] text-zinc-600 font-sans mt-1">Đang phân tích suy nghĩ của bạn</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs font-serif mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Response display */}
        {aiResponse && !loading && (
          <div className="flex-1 flex flex-col paper-dark p-5 rounded-2xl border border-gold-text/20 relative">
            <div className="flex items-center justify-between mb-3 border-b border-border-warm/40 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium font-sans">
                Phản hồi từ AI
              </span>
              <button
                onClick={copyToClipboard}
                className="text-xs text-zinc-400 hover:text-gold-accent flex items-center gap-1 transition-serene"
                title="Sao chép kết quả"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
            <div className="font-serif text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[400px] pr-2">
              {aiResponse}
            </div>
          </div>
        )}

        {!initialContent.trim() && !loading && !aiResponse && (
          <div className="text-center py-10 font-serif italic text-xs text-zinc-500">
            Chưa có nội dung để phân tích. Hãy nhập văn bản hoặc mở bài viết trước khi chọn AI.
          </div>
        )}
      </div>
    </div>
  );
}
