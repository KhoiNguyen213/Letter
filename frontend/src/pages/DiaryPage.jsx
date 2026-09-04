import React, { useState, useEffect } from 'react';
import { apiFetch, uploadFile, uploadFiles, getImageUrl } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import ImageGrid from '../components/ImageGrid.jsx';
import { Calendar as CalendarIcon, Plus, Search, Tag, Trash2, Edit3, Save, Image as ImageIcon, Music, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MOODS = [
  { id: 'Peaceful', label: '🌿 Bình yên', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
  { id: 'Grateful', label: '☀️ Biết ơn', color: 'text-amber-400 border-amber-900/40 bg-amber-950/20' },
  { id: 'Reflective', label: '💭 Trầm tư', color: 'text-indigo-400 border-indigo-900/40 bg-indigo-950/20' },
  { id: 'Melancholy', label: '🌙 Chút buồn', color: 'text-blue-400 border-blue-900/40 bg-blue-950/20' },
  { id: 'Energetic', label: '⚡ Tràn năng lượng', color: 'text-rose-400 border-rose-900/40 bg-rose-950/20' },
  { id: 'Thoughtful', label: '📚 Suy tưởng', color: 'text-purple-400 border-purple-900/40 bg-purple-950/20' },
];

export default function DiaryPage() {
  const { i18n } = useTranslation();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState('Peaceful');
  const [formTags, setFormTags] = useState('');
  const [formPrivateNotes, setFormPrivateNotes] = useState('');
  const [formImages, setFormImages] = useState([]);
  const [formAudio, setFormAudio] = useState({ url: '', title: '', duration: 0 });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchEntries();
  }, [search, selectedMoodFilter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedMoodFilter) queryParams.append('mood', selectedMoodFilter);

      const data = await apiFetch(`/diary?${queryParams.toString()}`);
      setEntries(data);
    } catch (err) {
      console.error('Error fetching diary entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTitle('');
    setFormContent('');
    setFormMood('Peaceful');
    setFormTags('');
    setFormPrivateNotes('');
    setFormImages([]);
    setFormAudio({ url: '', title: '', duration: 0 });
    setIsEditing(true);
  };

  const handleEditEntry = (entry) => {
    setEditingId(entry._id);
    setFormDate(entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormTitle(entry.title || '');
    setFormContent(entry.content || '');
    setFormMood(entry.mood || 'Peaceful');
    setFormTags(entry.tags ? entry.tags.join(', ') : '');
    setFormPrivateNotes(entry.privateNotes || '');
    
    // Support images array or fallback to legacy image
    const imgs = entry.images && entry.images.length > 0 ? entry.images : (entry.image ? [entry.image] : []);
    setFormImages(imgs);
    setFormAudio(entry.audio || { url: '', title: '', duration: 0 });
    setIsEditing(true);
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      if (files.length === 1) {
        const res = await uploadFile(files[0]);
        setFormImages((prev) => [...prev, res.url]);
      } else {
        const res = await uploadFiles(files);
        setFormImages((prev) => [...prev, ...res.urls]);
      }
    } catch (err) {
      alert('Lỗi tải ảnh lên: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeFormImage = (index) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAudio(true);
    try {
      const res = await uploadFile(file, file.name);
      setFormAudio({
        url: res.url,
        title: res.title || file.name,
        duration: res.duration || 0,
      });
    } catch (err) {
      alert('Lỗi tải âm thanh lên: ' + err.message);
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Vui lòng viết nội dung nhật ký.');
      return;
    }

    setSaving(true);
    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      date: formDate,
      title: formTitle,
      content: formContent,
      mood: formMood,
      tags: tagsArray,
      privateNotes: formPrivateNotes,
      image: formImages[0] || '',
      images: formImages,
      audio: formAudio,
    };

    try {
      if (editingId) {
        await apiFetch(`/diary/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/diary', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsEditing(false);
      fetchEntries();
    } catch (err) {
      alert('Không thể lưu nhật ký.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Xóa nhật ký ngày này?')) return;
    try {
      await apiFetch(`/diary/${id}`, { method: 'DELETE' });
      setEntries(entries.filter(e => e._id !== id));
    } catch (err) {
      alert('Không thể xóa nhật ký.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const openLightbox = (imgs, index = 0) => {
    setLightboxImages(imgs);
    setLightboxIndex(index);
  };

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl text-zinc-100 font-semibold mb-1 flex items-center gap-2">
            <CalendarIcon className="text-gold-accent" size={20} />
            <span>Nhật Ký Tĩnh Lặng</span>
          </h1>
          <p className="font-serif italic text-xs text-zinc-500">
            Mỗi ngày một góc nhìn nhẹ nhàng kèm nhiều hình ảnh kỷ niệm (bấm để phóng to/xoay) & âm thanh.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 hover:border-gold-text/50 rounded-xl text-xs text-gold-accent flex items-center gap-1.5 transition-serene font-serif cursor-pointer shadow-lg self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Viết nhật ký hôm nay</span>
          </button>
        )}
      </div>

      {/* Inline Editor */}
      {isEditing && (
        <form onSubmit={handleSaveEntry} className="paper-dark p-6 sm:p-8 rounded-2xl border border-gold-text/20 mb-10 flex flex-col gap-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border-warm/40 pb-4">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="bg-bg-dark border border-border-warm rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-sans focus:outline-none focus:border-gold-text/40"
              />
              <span className="font-serif italic text-xs text-gold-accent">
                {formatDate(formDate)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-full hover:bg-zinc-800 transition-serene"
              title="Đóng editor"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Tiêu đề nhật ký (Tùy chọn)..."
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full bg-transparent font-serif text-xl text-zinc-100 placeholder-zinc-600 focus:outline-none border-b border-zinc-800 pb-2"
          />

          {/* Main Content Area */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              Hôm nay của bạn như thế nào?
            </label>
            <textarea
              rows={7}
              placeholder="Viết những gì bạn cảm nhận..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full bg-bg-dark/80 border border-border-warm rounded-xl p-4 font-serif text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-gold-text/40 leading-relaxed resize-y"
            />
          </div>

          {/* Mood Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
              Cảm xúc chính (Mood):
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormMood(m.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-sans transition-serene cursor-pointer ${
                    formMood === m.id
                      ? `${m.color} border-gold-text/50 font-medium shadow`
                      : 'bg-bg-dark border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Attachments Section (Images & Audio) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-warm/40 pt-4">
            {/* Multiple Images Attachment */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ImageIcon size={12} className="text-gold-accent" />
                  Hình ảnh kỷ niệm ({formImages.length}):
                </span>
                {formImages.length > 0 && (
                  <span className="text-[9px] text-zinc-500">Có thể chọn nhiều ảnh</span>
                )}
              </label>

              {/* Uploaded Images Preview List */}
              {formImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-1">
                  {formImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-border-warm h-24 bg-black/40 group">
                      <img
                        src={getImageUrl(imgUrl)}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openLightbox(formImages, idx)}
                      />
                      <button
                        type="button"
                        onClick={() => removeFormImage(idx)}
                        className="absolute top-1 right-1 bg-black/80 hover:bg-black text-red-400 p-1 rounded-full text-xs transition-serene"
                        title="Xóa ảnh này"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <label className="border border-dashed border-border-warm hover:border-gold-text/30 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-serene bg-bg-dark">
                <span className="text-xs text-zinc-400 font-sans">
                  {uploadingImage ? 'Đang tải tệp ảnh lên...' : '+ Chọn hình ảnh (Cho phép chọn nhiều ảnh)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Audio Attachment */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans flex items-center gap-1">
                <Music size={12} className="text-gold-accent" />
                Âm thanh / Nhạc nền / Ghi âm:
              </label>
              {formAudio && formAudio.url ? (
                <div className="flex flex-col gap-2 p-3 bg-bg-dark border border-border-warm rounded-xl relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-serif truncate pr-4">{formAudio.title || 'Tệp âm thanh'}</span>
                    <button
                      type="button"
                      onClick={() => setFormAudio({ url: '', title: '', duration: 0 })}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <AudioPlayer url={formAudio.url} title={formAudio.title} />
                </div>
              ) : (
                <label className="border border-dashed border-border-warm hover:border-gold-text/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-serene bg-bg-dark">
                  <span className="text-xs text-zinc-400 font-sans">
                    {uploadingAudio ? 'Đang tải tệp...' : '+ Thêm tệp âm thanh/ghi âm'}
                  </span>
                  <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Tags & Private Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
                Thẻ (phân cách bằng dấu phẩy):
              </label>
              <input
                type="text"
                placeholder="VD: Gia đình, Kỷ niệm, Suy ngẫm"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="bg-bg-dark border border-border-warm rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-gold-text/40 font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">
                Ghi chú riêng tư thêm:
              </label>
              <input
                type="text"
                placeholder="Ghi chú bí mật..."
                value={formPrivateNotes}
                onChange={(e) => setFormPrivateNotes(e.target.value)}
                className="bg-bg-dark border border-border-warm rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-gold-text/40 font-sans"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border-warm/40 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-serene font-sans"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 text-xs text-gold-accent font-serif flex items-center gap-1.5 transition-serene shadow-lg cursor-pointer"
            >
              <Save size={13} />
              <span>{saving ? 'Đang lưu...' : 'Lưu nhật ký'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm kiếm dòng nhật ký..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-paper border border-border-warm rounded-full py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-gold-text/30 transition-serene font-sans"
          />
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
        </div>

        <select
          value={selectedMoodFilter}
          onChange={(e) => setSelectedMoodFilter(e.target.value)}
          className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer font-sans"
        >
          <option value="">Tất cả cảm xúc (Mood)</option>
          {MOODS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Diary Timeline Entries */}
      {loading ? (
        <div className="text-center py-20 font-serif italic text-zinc-500">
          Đang tải dòng nhật ký...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 paper-dark rounded-2xl border border-zinc-900 flex flex-col items-center justify-center p-8">
          <CalendarIcon size={28} className="text-zinc-700 mb-3" />
          <p className="font-serif italic text-sm text-zinc-500 mb-3">
            Chưa có dòng nhật ký nào được lưu trữ.
          </p>
          <button
            onClick={handleOpenCreate}
            className="text-xs text-gold-accent hover:text-gold-text underline uppercase tracking-widest cursor-pointer font-sans"
          >
            Viết cho hôm nay
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {entries.map((entry) => {
            const moodObj = MOODS.find(m => m.id === entry.mood) || MOODS[0];
            const entryImages = entry.images && entry.images.length > 0 ? entry.images : (entry.image ? [entry.image] : []);

            return (
              <div
                key={entry._id}
                className="paper-dark p-6 rounded-2xl border border-gold-text/10 hover:border-gold-text/25 transition-serene flex flex-col gap-4 group"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-warm/40 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-semibold text-sm text-gold-accent">
                      {formatDate(entry.date)}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${moodObj.color} font-sans`}>
                      {moodObj.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="text-zinc-500 hover:text-zinc-300 p-1 transition-serene"
                      title="Chỉnh sửa"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEntry(entry._id, e)}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-serene"
                      title="Xóa nhật ký"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Attached Image Grid with Lightbox Zoom Trigger */}
                <ImageGrid
                  images={entry.images}
                  legacyImage={entry.image}
                  onImageClick={(idx) => openLightbox(entryImages, idx)}
                />

                {/* Title & Content */}
                {entry.title && (
                  <h3 className="font-serif text-lg text-zinc-100 font-medium">
                    {entry.title}
                  </h3>
                )}

                <div className="font-serif text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </div>

                {/* Attached Audio Player if exists */}
                {entry.audio && entry.audio.url && (
                  <div className="pt-2 border-t border-border-warm/30">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans mb-1 block">
                      🎵 Âm thanh đính kèm
                    </span>
                    <AudioPlayer url={entry.audio.url} title={entry.audio.title || 'Nhật ký âm thanh'} />
                  </div>
                )}

                {/* Private Notes */}
                {entry.privateNotes && (
                  <div className="mt-1 p-3 rounded-xl bg-bg-dark/70 border border-zinc-800/80 text-xs text-zinc-400 font-serif italic">
                    🔒 Ghi chú riêng: {entry.privateNotes}
                  </div>
                )}

                {/* Footer Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-border-warm/30 text-[10px] text-zinc-500 font-sans">
                    <Tag size={11} className="text-zinc-600" />
                    <span>{entry.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        isOpen={lightboxImages.length > 0}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxImages([])}
      />
    </OwnerLayout>
  );
}
