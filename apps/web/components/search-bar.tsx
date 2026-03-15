'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';

interface SearchBarProps {
  placeholder: string;
  searchLabel: string;
}

export function SearchBar({ placeholder, searchLabel }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch() {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="flex max-w-xl mx-auto shadow-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder={placeholder}
        className="flex-1 rounded-l-lg border border-r-0 border-border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <button
        onClick={handleSearch}
        className="rounded-r-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        {searchLabel}
      </button>
    </div>
  );
}
