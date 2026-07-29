import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5 bg-zinc-950/40 border border-border-warm rounded-full px-2.5 py-1 text-xs text-zinc-400 focus-within:border-gold-text/30 transition-serene">
        <Globe size={11} className="text-zinc-500" />
        <select
          value={i18n.language?.startsWith('vi') ? 'vi' : 'en'}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-transparent border-none text-[11px] text-zinc-400 focus:outline-none cursor-pointer pr-1 uppercase tracking-wider font-sans font-medium"
          aria-label="Select Language / Chọn ngôn ngữ"
        >
          <option value="en" className="bg-bg-dark text-zinc-300">🇺🇸 EN</option>
          <option value="vi" className="bg-bg-dark text-zinc-300">🇻🇳 VI</option>
        </select>
      </div>
    </div>
  );
}
