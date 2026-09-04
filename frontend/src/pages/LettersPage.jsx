import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import AIPanel from '../components/AIPanel.jsx';
import { Search, Plus, Mail, Heart, Calendar, Tag, Trash2, Edit3, Eye, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LettersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [allTags, setAllTags] = useState([]);

  // AI Panel
  const [aiOpen, setAiOpen] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiRecipient, setAiRecipient] = useState('');

  useEffect(() => {
    fetchLetters();
  }, [search, selectedTag, selectedStatus, sort]);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedTag) queryParams.append('tag', selectedTag);
      if (selectedStatus) queryParams.append('status', selectedStatus);
      queryParams.append('sort', sort);

      const data = await apiFetch(`/letters?${queryParams.toString()}`);
      setLetters(data);

      const tagsSet = new Set();
      data.forEach(l => {
        if (l.tags) l.tags.forEach(t => t.trim() && tagsSet.add(t.trim()));
      });
      setAllTags(Array.from(tagsSet));
    } catch (err) {
      console.error('Error fetching letters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLetter = async () => {
    try {
      const newLetter = await apiFetch('/letters', {
        method: 'POST',
        body: JSON.stringify({
          recipient: 'Gửi bản thân',
          title: 'Lá thư chưa đặt tên',
          content: '',
          status: 'Draft',
        }),
      });
      navigate(`/letters/edit/${newLetter._id}`);
    } catch (err) {
      alert('Không thể tạo lá thư mới.');
    }
  };

  const handleDeleteLetter = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa lá thư riêng tư này?')) return;
    try {
      await apiFetch(`/letters/${id}`, { method: 'DELETE' });
      setLetters(letters.filter(l => l._id !== id));
    } catch (err) {
      alert('Không thể xóa lá thư.');
    }
  };

  const toggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      const updated = await apiFetch(`/letters/${id}/favorite`, { method: 'POST' });
      setLetters(letters.map(l => (l._id === id ? { ...l, isFavorite: updated.isFavorite } : l)));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const openAIReflection = (letter, e) => {
    e.stopPropagation();
    setAiContent(letter.content);
    setAiTitle(letter.title);
    setAiRecipient(letter.recipient);
    setAiOpen(true);
  };

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl text-zinc-100 font-semibold mb-1 flex items-center gap-2">
            <Mail className="text-gold-accent" size={20} />
            <span>Lá Thư Riêng Tư</span>
          </h1>
          <p className="font-serif italic text-xs text-zinc-500">
            Gửi cho bản thân, tương lai, hoặc những điều bạn chưa bao giờ thốt ra lời.
          </p>
        </div>

        <button
          onClick={handleCreateLetter}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 hover:border-gold-text/50 rounded-xl text-xs text-gold-accent flex items-center gap-1.5 transition-serene font-serif cursor-pointer shadow-lg self-start md:self-auto"
        >
          <Plus size={14} />
          <span>Viết lá thư mới</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm kiếm thư, người nhận, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-paper border border-border-warm rounded-full py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-gold-text/30 transition-serene font-sans"
          />
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer font-sans"
            >
              <option value="">Tất cả thẻ</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer font-sans"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Draft">Bản nháp</option>
            <option value="Completed">Hoàn tất</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer font-sans"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="updated">Cập nhật gần đây</option>
          </select>
        </div>
      </div>

      {/* Letters Grid */}
      {loading ? (
        <div className="text-center py-20 font-serif italic text-zinc-500">
          Đang tải danh sách lá thư...
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-16 paper-dark rounded-2xl border border-zinc-900 flex flex-col items-center justify-center p-8">
          <Mail size={28} className="text-zinc-700 mb-3" />
          <p className="font-serif italic text-sm text-zinc-500 mb-3">
            Chưa tìm thấy lá thư nào trong không gian này.
          </p>
          <button
            onClick={handleCreateLetter}
            className="text-xs text-gold-accent hover:text-gold-text underline uppercase tracking-widest cursor-pointer font-sans"
          >
            Viết lá thư đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {letters.map((letter) => (
            <div
              key={letter._id}
              onClick={() => navigate(`/letters/view/${letter._id}`)}
              className="paper-dark rounded-2xl p-6 flex flex-col justify-between cursor-pointer relative group transition-serene hover:-translate-y-0.5 border border-gold-text/10 hover:border-gold-text/30"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-sans ${letter.status === 'Draft' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'}`}>
                    {letter.status === 'Draft' ? 'Bản nháp' : 'Hoàn tất'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => openAIReflection(letter, e)}
                      className="text-zinc-500 hover:text-gold-accent p-1 transition-serene"
                      title="Phân tích với Gemini AI"
                    >
                      <Sparkles size={14} />
                    </button>
                    <button
                      onClick={(e) => toggleFavorite(letter._id, e)}
                      className="text-zinc-500 hover:text-gold-accent p-1 transition-serene"
                      title={letter.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                    >
                      <Heart size={14} className={letter.isFavorite ? 'fill-gold-text text-gold-text' : ''} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteLetter(letter._id, e)}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-serene"
                      title="Xóa thư"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-widest text-gold-accent font-sans mb-1">
                  Gửi: {letter.recipient || 'Bản thân'}
                </div>

                <h3 className="font-serif text-xl text-zinc-100 group-hover:text-gold-accent transition-serene leading-tight mb-2">
                  {letter.title || 'Lá thư chưa đặt tên'}
                </h3>

                <p className="text-xs text-zinc-400 font-serif line-clamp-3 leading-relaxed mb-4">
                  {letter.content ? letter.content.replace(/[#*`_]/g, '') : 'Chưa có nội dung...'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border-warm/40 pt-3.5 mt-auto text-[10px] text-zinc-500 font-sans">
                <span className="flex items-center gap-1.5">
                  <Calendar size={11} />
                  {formatDate(letter.createdAt)}
                </span>

                {letter.tags && letter.tags.length > 0 && (
                  <div className="flex items-center gap-1 max-w-[150px] overflow-hidden truncate">
                    <Tag size={10} className="text-zinc-600 flex-shrink-0" />
                    <span className="truncate">{letter.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Drawer */}
      <AIPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        initialContent={aiContent}
        title={aiTitle}
        recipient={aiRecipient}
        contextType="letter"
      />
    </OwnerLayout>
  );
}
