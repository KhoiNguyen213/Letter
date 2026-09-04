import React, { useState, useEffect } from 'react';
import { apiFetch, uploadFile, uploadFiles, getImageUrl } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import ImageGrid from '../components/ImageGrid.jsx';
import { StickyNote, Plus, Search, Tag, Trash2, Save, Image as ImageIcon, Music, X, Pin } from 'lucide-react';

const CATEGORIES = [
  { id: 'Personal', label: 'Cá nhân' },
  { id: 'Idea', label: '💡 Ý tưởng' },
  { id: 'Plan', label: '🗺️ Kế hoạch' },
  { id: 'Remember', label: '📌 Cần nhớ' },
  { id: 'Goal', label: '🎯 Mục tiêu' },
  { id: 'List', label: '📝 Danh sách' },
  { id: 'Random', label: '💭 Tản mạn' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formTags, setFormTags] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formImages, setFormImages] = useState([]);
  const [formAudio, setFormAudio] = useState({ url: '', title: '', duration: 0 });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchNotes();
  }, [search, selectedCategoryFilter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedCategoryFilter) queryParams.append('category', selectedCategoryFilter);

      const data = await apiFetch(`/notes?${queryParams.toString()}`);
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('Personal');
    setFormTags('');
    setFormIsPinned(false);
    setFormImages([]);
    setFormAudio({ url: '', title: '', duration: 0 });
    setIsModalOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingId(note._id);
    setFormTitle(note.title || '');
    setFormContent(note.content || '');
    setFormCategory(note.category || 'Personal');
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormIsPinned(note.isPinned || false);

    const imgs = note.images && note.images.length > 0 ? note.images : (note.image ? [note.image] : []);
    setFormImages(imgs);
    setFormAudio(note.audio || { url: '', title: '', duration: 0 });
    setIsModalOpen(true);
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

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tiêu đề ghi chú.');
      return;
    }

    setSaving(true);
    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      tags: tagsArray,
      isPinned: formIsPinned,
      image: formImages[0] || '',
      images: formImages,
      audio: formAudio,
    };

    try {
      if (editingId) {
        await apiFetch(`/notes/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/notes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      alert('Không thể lưu ghi chú.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      await apiFetch(`/notes/${id}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      alert('Không thể xóa ghi chú.');
    }
  };

  const togglePin = async (note, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/notes/${note._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const openLightbox = (imgs, index = 0, e) => {
    if (e) e.stopPropagation();
    setLightboxImages(imgs);
    setLightboxIndex(index);
  };

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl text-zinc-100 font-semibold mb-1 flex items-center gap-2">
            <StickyNote className="text-gold-accent" size={20} />
            <span>Ghi Chú & Góc Lưu Trữ</span>
          </h1>
          <p className="font-serif italic text-xs text-zinc-500">
            Lưu giữ mọi ý tưởng, kế hoạch, danh sách kèm hình ảnh (bấm để xem đầy đủ/xoay) & ghi âm.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 hover:border-gold-text/50 rounded-xl text-xs text-gold-accent flex items-center gap-1.5 transition-serene font-serif cursor-pointer shadow-lg self-start md:self-auto"
        >
          <Plus size={14} />
          <span>Thêm ghi chú mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm kiếm ý tưởng, ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-paper border border-border-warm rounded-full py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-gold-text/30 transition-serene font-sans"
          />
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategoryFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-sans transition-serene cursor-pointer ${
              selectedCategoryFilter === '' ? 'bg-zinc-900 text-gold-accent border border-gold-text/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans transition-serene cursor-pointer ${
                selectedCategoryFilter === cat.id ? 'bg-zinc-900 text-gold-accent border border-gold-text/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="text-center py-20 font-serif italic text-zinc-500">
          Đang tải không gian ghi chú...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 paper-dark rounded-2xl border border-zinc-900 flex flex-col items-center justify-center p-8">
          <StickyNote size={28} className="text-zinc-700 mb-3" />
          <p className="font-serif italic text-sm text-zinc-500 mb-3">
            Chưa có ghi chú nào được lưu.
          </p>
          <button
            onClick={handleOpenCreate}
            className="text-xs text-gold-accent hover:text-gold-text underline uppercase tracking-widest cursor-pointer font-sans"
          >
            Tạo ghi chú mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => {
            const noteImages = note.images && note.images.length > 0 ? note.images : (note.image ? [note.image] : []);
            return (
              <div
                key={note._id}
                onClick={() => handleEditNote(note)}
                className={`paper-dark rounded-2xl p-5 flex flex-col justify-between cursor-pointer relative group transition-serene hover:-translate-y-0.5 border ${
                  note.isPinned ? 'border-gold-text/40 shadow-md bg-bg-dark/90' : 'border-gold-text/10 hover:border-gold-text/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-wider text-gold-accent font-sans bg-gold-text/10 px-2 py-0.5 rounded border border-gold-text/20">
                      {CATEGORIES.find(c => c.id === note.category)?.label || note.category}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => togglePin(note, e)}
                        className={`p-1 transition-serene ${note.isPinned ? 'text-gold-accent' : 'text-zinc-600 hover:text-zinc-400'}`}
                        title={note.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                      >
                        <Pin size={13} className={note.isPinned ? 'fill-gold-accent' : ''} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(note._id, e)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-serene"
                        title="Xóa ghi chú"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Attached Images Grid */}
                  <div className="mb-3">
                    <ImageGrid
                      images={note.images}
                      legacyImage={note.image}
                      onImageClick={(idx) => openLightbox(noteImages, idx)}
                    />
                  </div>

                  <h3 className="font-serif text-base text-zinc-100 font-semibold mb-2 group-hover:text-gold-accent transition-serene">
                    {note.title}
                  </h3>

                  <p className="text-xs text-zinc-300 font-serif whitespace-pre-wrap line-clamp-6 leading-relaxed mb-3">
                    {note.content}
                  </p>

                  {/* Attached Audio Player */}
                  {note.audio && note.audio.url && (
                    <div className="my-2 pt-2 border-t border-border-warm/30" onClick={(e) => e.stopPropagation()}>
                      <AudioPlayer url={note.audio.url} title={note.audio.title || 'Âm thanh ghi chú'} />
                    </div>
                  )}
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-1 border-t border-border-warm/40 pt-2 mt-auto text-[10px] text-zinc-500 font-sans">
                    <Tag size={10} className="text-zinc-600" />
                    <span className="truncate">{note.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg paper-dark rounded-2xl border border-gold-text/20 p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-warm/40 pb-3">
              <h3 className="font-serif text-lg text-zinc-100 font-medium">
                {editingId ? 'Chỉnh Sửa Ghi Chú' : 'Tạo Ghi Chú Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-full hover:bg-zinc-800 transition-serene"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">Tiêu đề</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-bg-dark border border-border-warm rounded-xl px-3.5 py-2 text-sm text-zinc-100 font-serif focus:outline-none focus:border-gold-text/40"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">Phân loại</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="bg-bg-dark border border-border-warm rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-gold-text/40"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">Nội dung ghi chú</label>
                <textarea
                  rows={5}
                  placeholder="Viết thông tin, suy nghĩ, danh sách..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="bg-bg-dark border border-border-warm rounded-xl p-3.5 text-xs text-zinc-200 font-serif focus:outline-none focus:border-gold-text/40 leading-relaxed resize-y"
                />
              </div>

              {/* Media Upload (Images & Audio) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border-warm/40 pt-3">
                {/* Images upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans flex items-center gap-1">
                    <ImageIcon size={11} className="text-gold-accent" /> Hình ảnh ({formImages.length}):
                  </label>

                  {formImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mb-1">
                      {formImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative rounded border border-border-warm h-16 bg-black/40 overflow-hidden group">
                          <img
                            src={getImageUrl(imgUrl)}
                            alt="Note thumb"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openLightbox(formImages, idx)}
                          />
                          <button
                            type="button"
                            onClick={() => removeFormImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-black/80 text-red-400 p-0.5 rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="border border-dashed border-border-warm rounded-xl p-2.5 text-center cursor-pointer bg-bg-dark hover:border-gold-text/30 transition-serene">
                    <span className="text-[11px] text-zinc-400 font-sans">
                      {uploadingImage ? 'Đang tải...' : '+ Thêm ảnh (chọn nhiều)'}
                    </span>
                    <input type="file" accept="image/*" multiple onChange={handleImagesUpload} className="hidden" />
                  </label>
                </div>

                {/* Audio upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans flex items-center gap-1">
                    <Music size={11} className="text-gold-accent" /> Âm thanh:
                  </label>
                  {formAudio && formAudio.url ? (
                    <div className="flex flex-col gap-1 p-2 bg-bg-dark border border-border-warm rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-300 truncate">{formAudio.title || 'Tệp âm thanh'}</span>
                        <button type="button" onClick={() => setFormAudio({ url: '', title: '', duration: 0 })} className="text-red-400">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-border-warm rounded-xl p-3 text-center cursor-pointer bg-bg-dark">
                      <span className="text-[11px] text-zinc-400 font-sans">{uploadingAudio ? 'Đang tải...' : '+ Thêm tệp âm thanh'}</span>
                      <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans">Thẻ (tags)</label>
                <input
                  type="text"
                  placeholder="VD: Việc làm, Ý tưởng mới"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="bg-bg-dark border border-border-warm rounded-xl px-3.5 py-2 text-xs text-zinc-300 font-sans focus:outline-none focus:border-gold-text/40"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded border-zinc-700 bg-bg-dark text-gold-accent focus:ring-0 cursor-pointer"
                />
                <label htmlFor="pinCheck" className="text-xs text-zinc-300 font-sans cursor-pointer">
                  Ghim ghi chú này lên đầu danh sách
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-warm/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>{saving ? 'Đang lưu...' : 'Lưu ghi chú'}</span>
                </button>
              </div>
            </form>
          </div>
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
