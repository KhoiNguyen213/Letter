import React, { useState } from 'react';
import OwnerLayout from '../components/OwnerLayout.jsx';
import { apiFetch } from '../utils/api.js';
import { Sparkles, Wand2, FileText, HelpCircle, Lightbulb, Compass, Copy, Check, RefreshCw, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AIPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState('reflect');

  const handleExecuteAI = async (actionType) => {
    if (!content.trim() && actionType !== 'prompts') {
      alert('Vui lòng nhập suy nghĩ hoặc nội dung bài viết.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setActiveAction(actionType);

    try {
      const data = await apiFetch('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          action: actionType,
          content,
          contextType: 'general',
        }),
      });

      if (data.result) {
        setResult(data.result);
      } else {
        setError('Không nhận được câu trả lời từ Gemini.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi kết nối với Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-zinc-100 font-semibold mb-1 flex items-center gap-2">
          <Sparkles className="text-gold-accent" size={20} />
          <span>Góc Suy Ngẫm Gemini AI</span>
        </h1>
        <p className="font-serif italic text-xs text-zinc-500">
          Trợ lý AI cá nhân hoàn toàn riêng tư cho nội dung của bạn.
        </p>
      </div>

      {/* Security Banner */}
      <div className="paper-dark p-4 rounded-xl border border-gold-text/15 mb-8 flex items-center justify-between gap-4 text-xs text-zinc-400 font-sans">
        <div className="flex items-center gap-2">
          <Lock className="text-gold-accent flex-shrink-0" size={16} />
          <span>
            <strong className="text-zinc-200">Riêng tư tuyệt đối:</strong> AI chỉ hoạt động khi bạn nhấn nút xử lý. Khung hội thoại và API key không bao giờ lộ ra ngoài.
          </span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Input area */}
        <div className="paper-dark p-6 rounded-2xl border border-border-warm flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              Nhập suy nghĩ, bài viết hoặc lá thư cần AI hỗ trợ:
            </label>
            <textarea
              rows={10}
              placeholder="Dán hoặc viết bất kỳ điều gì bạn muốn suy ngẫm ở đây..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-bg-dark border border-border-warm rounded-xl p-4 font-serif text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-gold-text/40 leading-relaxed resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              Chọn hành động phản hồi từ AI:
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleExecuteAI('reflect')}
                disabled={loading}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/20 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene cursor-pointer font-serif disabled:opacity-40"
              >
                <Sparkles size={14} className="text-gold-accent" />
                <span>Suy ngẫm thấu cảm</span>
              </button>

              <button
                onClick={() => handleExecuteAI('analyze')}
                disabled={loading}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/20 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene cursor-pointer font-serif disabled:opacity-40"
              >
                <Wand2 size={14} className="text-gold-accent" />
                <span>Phân tích cảm xúc</span>
              </button>

              <button
                onClick={() => handleExecuteAI('summarize')}
                disabled={loading}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/20 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene cursor-pointer font-serif disabled:opacity-40"
              >
                <FileText size={14} className="text-gold-accent" />
                <span>Tóm tắt ý chính</span>
              </button>

              <button
                onClick={() => handleExecuteAI('improve')}
                disabled={loading}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/20 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene cursor-pointer font-serif disabled:opacity-40"
              >
                <Sparkles size={14} className="text-gold-accent" />
                <span>Gợi ý sửa văn phong</span>
              </button>

              <button
                onClick={() => handleExecuteAI('questions')}
                disabled={loading}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/20 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene cursor-pointer font-serif disabled:opacity-40"
              >
                <HelpCircle size={14} className="text-gold-accent" />
                <span>Câu hỏi tự vấn</span>
              </button>

              <button
                onClick={() => handleExecuteAI('prompts')}
                disabled={loading}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/20 hover:border-gold-text/40 text-xs text-zinc-200 flex items-center gap-2 transition-serene cursor-pointer font-serif disabled:opacity-40"
              >
                <Compass size={14} className="text-gold-accent" />
                <span>Gợi ý chủ đề viết</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output result */}
        <div className="paper-dark p-6 rounded-2xl border border-gold-text/15 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-border-warm/40 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium font-sans flex items-center gap-1.5">
              <Sparkles size={13} />
              Góc Phản Hồi Từ Gemini
            </span>
            {result && (
              <button
                onClick={copyResult}
                className="text-xs text-zinc-400 hover:text-gold-accent flex items-center gap-1 transition-serene font-sans"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw size={28} className="text-gold-accent animate-spin mb-3" />
              <p className="font-serif italic text-sm text-zinc-300">Đang gửi yêu cầu an toàn đến Gemini...</p>
              <span className="text-[10px] text-zinc-600 font-sans mt-1">Đang đúc kết suy nghĩ của bạn</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs font-serif">
              ⚠️ {error}
            </div>
          ) : result ? (
            <div className="flex-1 font-serif text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[480px] pr-2">
              {result}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <Lightbulb size={32} className="text-zinc-700 mb-3" />
              <p className="font-serif italic text-xs text-zinc-500 max-w-xs">
                Chọn một nút hành động bên trái để bắt đầu phân tích hoặc trò chuyện cùng trợ lý Gemini.
              </p>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
