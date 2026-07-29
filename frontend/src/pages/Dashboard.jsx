import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, SERVER_BASE } from '../utils/api.js';
import OwnerLayout from '../components/OwnerLayout.jsx';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Star, Tag, Calendar, Eye, EyeOff, Archive, BookOpen, Trash2, Heart } from 'lucide-react';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [promptIndex, setPromptIndex] = useState(0);
  const [allTags, setAllTags] = useState([]);
  const [dbError, setDbError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Pick a random prompt index on mount
    const totalPrompts = 7;
    setPromptIndex(Math.floor(Math.random() * totalPrompts));
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [search, selectedTag, selectedStatus, sort]);

  const fetchLetters = async () => {
    try {
      setDbError(false);
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedTag) queryParams.append('tag', selectedTag);
      if (selectedStatus) queryParams.append('status', selectedStatus);
      queryParams.append('sort', sort);

      const data = await apiFetch(`/letters?${queryParams.toString()}`);
      setLetters(data);

      // Collect all unique tags
      const tagsSet = new Set();
      data.forEach(letter => {
        if (letter.tags) {
          letter.tags.forEach(t => {
            if (t.trim()) tagsSet.add(t.trim());
          });
        }
      });
      setAllTags(Array.from(tagsSet));
    } catch (err) {
      console.error('Error fetching letters:', err);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLetter = async () => {
    try {
      const newLetter = await apiFetch('/letters', { method: 'POST' });
      navigate(`/edit/${newLetter._id}`);
    } catch (err) {
      alert(t('dashboard:db_warning'));
    }
  };

  const toggleFavorite = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const updated = await apiFetch(`/letters/${id}/favorite`, { method: 'POST' });
      setLetters(letters.map(l => (l._id === id ? { ...l, isFavorite: updated.isFavorite } : l)));
    } catch (err) {
      console.error(err);
    }
  };

  const cyclePrompt = () => {
    const totalPrompts = 7;
    let nextIndex = Math.floor(Math.random() * totalPrompts);
    while (nextIndex === promptIndex) {
      nextIndex = Math.floor(Math.random() * totalPrompts);
    }
    setPromptIndex(nextIndex);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('dashboard:undated');
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'text-zinc-500 border-zinc-800 bg-zinc-950/20';
      case 'Sealed': return 'text-amber-500 border-amber-950/40 bg-amber-950/10';
      case 'Shared': return 'text-emerald-500 border-emerald-950/40 bg-emerald-950/10';
      case 'Archived': return 'text-zinc-600 border-zinc-900 bg-zinc-950/40';
      default: return 'text-zinc-400 border-zinc-800';
    }
  };

  // Dynamic Prompt Loading from i18n
  const localizedPrompts = t('dashboard:prompts', { returnObjects: true });
  const currentPrompt = Array.isArray(localizedPrompts) && localizedPrompts[promptIndex]
    ? localizedPrompts[promptIndex]
    : '';

  return (
    <OwnerLayout>
      {/* Reflection Prompts Header */}
      <div className="paper-dark p-6 rounded-2xl border border-gold-text/10 mb-8 flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gold-text/2 blur-[40px] pointer-events-none" />
        <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium">{t('dashboard:inspiration_prompt')}</span>
        <p className="font-serif italic text-base text-zinc-300 leading-relaxed">
          "{currentPrompt}"
        </p>
        <button 
          onClick={cyclePrompt}
          className="self-start text-[10px] text-zinc-500 hover:text-gold-accent uppercase tracking-widest transition-serene mt-1 cursor-pointer"
          aria-label={t('dashboard:draw_prompt')}
        >
          {t('dashboard:draw_prompt')}
        </button>
      </div>

      {/* Database Warning */}
      {dbError && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-300 text-xs font-serif text-center">
          ⚠️ {t('dashboard:db_warning')}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder={t('dashboard:search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-paper border border-border-warm rounded-full py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-gold-text/30 transition-serene"
            aria-label={t('dashboard:search_placeholder')}
          />
          <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer"
              aria-label={t('dashboard:all_tags')}
            >
              <option value="">{t('dashboard:all_tags')}</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer"
            aria-label={t('dashboard:all_statuses')}
          >
            <option value="">{t('dashboard:all_statuses')}</option>
            <option value="Draft">{t('dashboard:statuses.draft')}</option>
            <option value="Sealed">{t('dashboard:statuses.sealed')}</option>
            <option value="Shared">{t('dashboard:statuses.shared')}</option>
            <option value="Archived">{t('dashboard:statuses.archived')}</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-bg-paper border border-border-warm text-xs text-zinc-400 rounded-full px-3 py-1.5 focus:outline-none focus:border-gold-text/30 transition-serene cursor-pointer"
            aria-label="Sort options"
          >
            <option value="newest">{t('dashboard:sort.newest')}</option>
            <option value="oldest">{t('dashboard:sort.oldest')}</option>
            <option value="memoryDateNewest">{t('dashboard:sort.memory_newest')}</option>
            <option value="memoryDateOldest">{t('dashboard:sort.memory_oldest')}</option>
          </select>

          {/* Write Button */}
          <button
            onClick={handleCreateLetter}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-gold-text/30 hover:border-gold-text/50 rounded-full text-xs text-gold-accent flex items-center gap-1.5 transition-serene font-serif focus:outline-none cursor-pointer"
            aria-label={t('dashboard:write_letter')}
          >
            <Plus size={13} />
            {t('dashboard:write_letter')}
          </button>
        </div>
      </div>

      {/* Letters Index Layout */}
      {loading ? (
        <div className="text-center py-20 font-serif italic text-zinc-500">
          {t('common:loading')}
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-20 paper-dark rounded-2xl border border-zinc-900 flex flex-col items-center justify-center p-8">
          <BookOpen size={24} className="text-zinc-700 mb-3" />
          <p className="font-serif italic text-sm text-zinc-500">
            {t('dashboard:no_memories')}
          </p>
          <button 
            onClick={handleCreateLetter}
            className="text-xs text-gold-accent hover:text-gold-text underline uppercase tracking-widest mt-2 cursor-pointer"
          >
            {t('dashboard:create_first')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {letters.map((letter) => (
            <div
              key={letter._id}
              onClick={() => navigate(`/view/${letter._id}`)}
              className="paper-dark rounded-2xl p-6 flex flex-col justify-between cursor-pointer relative group transition-serene hover:-translate-y-0.5 border border-gold-text/5"
            >
              {/* Cover Image thumbnail if exists */}
              {letter.coverImage && (
                <div className="h-28 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl relative border-b border-border-warm">
                  <img
                    src={letter.coverImage.startsWith('http') ? letter.coverImage : `${SERVER_BASE}${letter.coverImage}`}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-serene"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-paper to-transparent" />
                </div>
              )}

              <div>
                {/* Header: Favorite & Status */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(letter.status)}`}>
                      {t('dashboard:status_tags.' + letter.status)}
                    </span>
                    {letter.unlockDate && new Date(letter.unlockDate) > new Date() && (
                      <span className="text-[9px] text-amber-500/80 font-sans tracking-wide">
                        {t('dashboard:capsule')}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(letter._id, e)}
                    className="text-zinc-600 hover:text-gold-accent transition-serene p-1 cursor-pointer"
                    title={letter.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                  >
                    <Heart size={14} className={letter.isFavorite ? 'fill-gold-text text-gold-text' : ''} />
                  </button>
                </div>

                {/* Recipient */}
                <div className="text-[10px] uppercase tracking-widest text-gold-accent font-sans mb-1">
                  {t('dashboard:to_recipient', { name: letter.recipient })}
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl text-zinc-100 group-hover:text-gold-accent transition-serene leading-tight mb-2">
                  {letter.title || t('dashboard:statuses.draft')}
                </h3>

                {/* Snippet */}
                <p className="text-xs text-zinc-500 font-serif line-clamp-3 leading-relaxed mb-4">
                  {letter.content ? letter.content.replace(/[#*`_]/g, '') : t('dashboard:no_content_yet')}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border-warm/40 pt-3.5 mt-auto text-[10px] text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Calendar size={11} />
                  {t('dashboard:written_on', { date: formatDate(letter.memoryDate || letter.createdAt) })}
                </span>

                {letter.tags && letter.tags.length > 0 && (
                  <div className="flex items-center gap-1 max-w-[150px] overflow-hidden truncate">
                    <Tag size={10} className="text-zinc-700 flex-shrink-0" />
                    <span className="truncate">{letter.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
