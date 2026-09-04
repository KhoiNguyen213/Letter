import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import AIPanel from '../components/AIPanel.jsx';
import { Mail, Calendar, StickyNote, Sparkles, Plus, ArrowRight, Heart, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [recentLetters, setRecentLetters] = useState([]);
  const [recentDiary, setRecentDiary] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiTitle, setAiTitle] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [letters, diary, notes] = await Promise.all([
        apiFetch('/letters?sort=newest').catch(() => []),
        apiFetch('/diary?sort=newest').catch(() => []),
        apiFetch('/notes?sort=updated').catch(() => []),
      ]);

      setRecentLetters(letters.slice(0, 3));
      setRecentDiary(diary.slice(0, 3));
      setRecentNotes(notes.slice(0, 4));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const openAIReflection = (content, title = 'Ghi chép hôm nay') => {
    setAiContent(content);
    setAiTitle(title);
    setAiOpen(true);
  };

  return (
    <OwnerLayout>
      {/* Welcome Banner */}
      <div className="paper-dark p-8 rounded-2xl border border-gold-text/15 mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold-text/5 blur-[50px] pointer-events-none" />
        
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium font-sans block mb-1">
            Không gian cá nhân • {new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <h1 className="font-serif text-2xl md:text-3xl text-zinc-100 font-semibold mb-2">
            Chào mừng trở lại không gian tĩnh lặng.
          </h1>
          <p className="font-serif italic text-xs text-zinc-400 max-w-lg leading-relaxed">
            "Viết là hành trình gặp gỡ lại chính mình, lưu giữ những ký ức và suy ngẫm chân thật nhất."
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/letters/new')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 hover:border-gold-text/50 rounded-xl text-xs text-gold-accent flex items-center gap-1.5 transition-serene font-serif cursor-pointer shadow-lg"
          >
            <Plus size={13} />
            <span>Viết lá thư mới</span>
          </button>

          <button
            onClick={() => navigate('/diary/new')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-border-warm hover:border-zinc-700 rounded-xl text-xs text-zinc-300 flex items-center gap-1.5 transition-serene font-serif cursor-pointer"
          >
            <Calendar size={13} className="text-gold-accent" />
            <span>Viết nhật ký</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-serif italic text-zinc-500">
          Đang tải không gian riêng của bạn...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column (Letters & Diary) */}
          <div className="md:col-span-2 flex flex-col gap-8">
            {/* Letters Section */}
            <div className="paper-dark p-6 rounded-2xl border border-border-warm/60">
              <div className="flex items-center justify-between mb-5 border-b border-border-warm/40 pb-3">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gold-accent" />
                  <h2 className="font-serif text-lg text-zinc-100 font-medium">Những Lá Thư Private</h2>
                </div>
                <Link
                  to="/letters"
                  className="text-xs text-zinc-400 hover:text-gold-accent flex items-center gap-1 transition-serene font-sans"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {recentLetters.length === 0 ? (
                <div className="text-center py-8 text-xs font-serif italic text-zinc-500">
                  Chưa có lá thư nào được viết. Hãy gửi một lời nhắn cho chính bạn.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentLetters.map((letter) => (
                    <div
                      key={letter._id}
                      onClick={() => navigate(`/letters/view/${letter._id}`)}
                      className="p-4 rounded-xl bg-bg-dark/60 hover:bg-bg-dark border border-border-warm/30 hover:border-gold-text/30 cursor-pointer transition-serene flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] uppercase tracking-wider text-gold-accent font-sans">
                            Gửi: {letter.recipient}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${letter.status === 'Draft' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'}`}>
                            {letter.status === 'Draft' ? 'Bản nháp' : 'Hoàn tất'}
                          </span>
                        </div>
                        <h3 className="font-serif text-sm text-zinc-200 group-hover:text-gold-accent transition-serene">
                          {letter.title || 'Thư chưa đặt tên'}
                        </h3>
                      </div>

                      <span className="text-[10px] text-zinc-600 font-sans flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(letter.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Diary Section */}
            <div className="paper-dark p-6 rounded-2xl border border-border-warm/60">
              <div className="flex items-center justify-between mb-5 border-b border-border-warm/40 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gold-accent" />
                  <h2 className="font-serif text-lg text-zinc-100 font-medium">Nhật Ký Ngày Hát</h2>
                </div>
                <Link
                  to="/diary"
                  className="text-xs text-zinc-400 hover:text-gold-accent flex items-center gap-1 transition-serene font-sans"
                >
                  <span>Xem nhật ký</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {recentDiary.length === 0 ? (
                <div className="text-center py-8 text-xs font-serif italic text-zinc-500">
                  Hôm nay bạn thế nào? Viết lại vài dòng nhật ký nhẹ nhàng.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentDiary.map((entry) => (
                    <div
                      key={entry._id}
                      onClick={() => navigate('/diary')}
                      className="p-4 rounded-xl bg-bg-dark/60 hover:bg-bg-dark border border-border-warm/30 hover:border-gold-text/30 cursor-pointer transition-serene flex items-start justify-between group"
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-gold-accent font-medium font-sans">
                            {formatDate(entry.date)}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-text/10 text-gold-text border border-gold-text/20">
                            {entry.mood}
                          </span>
                        </div>
                        <h3 className="font-serif text-sm text-zinc-200 group-hover:text-gold-accent transition-serene mb-1">
                          {entry.title || 'Dòng suy ngẫm'}
                        </h3>
                        <p className="text-xs text-zinc-400 font-serif line-clamp-2 leading-relaxed">
                          {entry.content}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAIReflection(entry.content, entry.title || 'Nhật ký');
                        }}
                        className="text-xs text-zinc-500 hover:text-gold-accent p-1.5 rounded-lg hover:bg-zinc-800 transition-serene"
                        title="Hỏi AI Gemini về dòng nhật ký này"
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Notes & Personal Things) */}
          <div className="flex flex-col gap-8">
            {/* Notes Space */}
            <div className="paper-dark p-6 rounded-2xl border border-border-warm/60">
              <div className="flex items-center justify-between mb-5 border-b border-border-warm/40 pb-3">
                <div className="flex items-center gap-2">
                  <StickyNote size={16} className="text-gold-accent" />
                  <h2 className="font-serif text-lg text-zinc-100 font-medium">Ghi Chú & Ý Tưởng</h2>
                </div>
                <Link
                  to="/notes"
                  className="text-xs text-zinc-400 hover:text-gold-accent flex items-center gap-1 transition-serene font-sans"
                >
                  <ArrowRight size={12} />
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <div className="text-center py-6 text-xs font-serif italic text-zinc-500">
                  Lưu lại những điều cần nhớ, kế hoạch hoặc mục tiêu cá nhân.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentNotes.map((note) => (
                    <div
                      key={note._id}
                      onClick={() => navigate('/notes')}
                      className="p-3.5 rounded-xl bg-bg-dark/60 hover:bg-bg-dark border border-border-warm/30 hover:border-gold-text/30 cursor-pointer transition-serene"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans">
                          {note.category}
                        </span>
                        {note.isPinned && <Heart size={10} className="text-gold-accent fill-gold-accent" />}
                      </div>
                      <h4 className="font-serif text-xs text-zinc-200 font-medium line-clamp-1">
                        {note.title}
                      </h4>
                      {note.content && (
                        <p className="text-[11px] text-zinc-400 font-serif line-clamp-2 mt-1 leading-normal">
                          {note.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/notes')}
                className="w-full mt-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-serif transition-serene cursor-pointer"
              >
                + Thêm ghi chú mới
              </button>
            </div>

            {/* Private AI Assistant Banner */}
            <div className="paper-dark p-6 rounded-2xl border border-gold-text/20 relative overflow-hidden flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-gold-accent" size={16} />
                <h3 className="font-serif text-base text-zinc-100 font-medium">Trợ Lý AI Gemini</h3>
              </div>
              <p className="font-serif italic text-xs text-zinc-400 leading-relaxed">
                Trợ lý suy ngẫm riêng tư của bạn. Bạn có thể phân tích nhật ký, gợi ý câu hỏi tự vấn hoặc tóm tắt thông tin.
              </p>
              <button
                onClick={() => openAIReflection('Hãy gợi ý cho tôi một chủ đề suy ngẫm cho ngày hôm nay.', 'Góc AI')}
                className="mt-2 py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 text-xs text-gold-accent font-serif flex items-center justify-center gap-2 transition-serene cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Trò chuyện / Suy ngẫm với AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Side Drawer */}
      <AIPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        initialContent={aiContent}
        title={aiTitle}
      />
    </OwnerLayout>
  );
}
