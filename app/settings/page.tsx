'use client';

import { useEffect, useRef, useState } from 'react';
import { GeistSans } from 'geist/font/sans';

type ThemeChoice = 'light' | 'dark' | 'system';
type FontChoice = 'bricolage' | 'geist-tight';

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [font, setFont] = useState<FontChoice>('bricolage');
  const [mounted, setMounted] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mqlRef = useRef<MediaQueryList | null>(null);
  const sysListenerRef = useRef<((e: MediaQueryListEvent) => void) | null>(null);

  // Initial hydration: read state from localStorage + DOM
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme') as ThemeChoice | null;
      const storedFont = localStorage.getItem('font') as FontChoice | null;
      const initialTheme: ThemeChoice =
        storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
          ? storedTheme
          : 'system';
      const initialFont: FontChoice =
        storedFont === 'geist-tight' ? 'geist-tight' : 'bricolage';
      setTheme(initialTheme);
      setFont(initialFont);

      // If system was the initial choice, attach a listener so the page
      // reacts to OS theme changes mid-session.
      if (initialTheme === 'system') attachSystemListener();
    } catch {
      // ignore
    }
    setMounted(true);

    return () => {
      detachSystemListener();
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function attachSystemListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (mqlRef.current) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    if (mql.addEventListener) mql.addEventListener('change', listener);
    else mql.addListener(listener);
    mqlRef.current = mql;
    sysListenerRef.current = listener;
  }

  function detachSystemListener() {
    const mql = mqlRef.current;
    const listener = sysListenerRef.current;
    if (mql && listener) {
      if (mql.removeEventListener) mql.removeEventListener('change', listener);
      else mql.removeListener(listener);
    }
    mqlRef.current = null;
    sysListenerRef.current = null;
  }

  function flashSaved() {
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1400);
  }

  function applyTheme(next: ThemeChoice) {
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {}
    const d = document.documentElement;
    if (next === 'dark') {
      d.classList.add('dark');
      detachSystemListener();
    } else if (next === 'light') {
      d.classList.remove('dark');
      detachSystemListener();
    } else {
      // system
      const sysDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      d.classList.toggle('dark', !!sysDark);
      attachSystemListener();
    }
    flashSaved();
  }

  function applyFont(next: FontChoice) {
    setFont(next);
    try {
      localStorage.setItem('font', next);
    } catch {}
    document.documentElement.classList.toggle('font-geist-tight', next === 'geist-tight');
    flashSaved();
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Customize your appearance and preferences.
          </p>
        </div>
        <div
          aria-live="polite"
          className={`text-xs text-pink-500 transition-opacity duration-300 ${
            savedFlash ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Saved
        </div>
      </div>

      {/* Appearance section */}
      <section className="bg-[#fafafc] dark:bg-[#0a0a0a] rounded-3xl p-8 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
          Appearance
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
          Choose how the app looks and feels.
        </p>

        {/* Theme */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">Theme</h3>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Applied immediately
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ThemeCard
              label="Light"
              selected={mounted && theme === 'light'}
              onClick={() => applyTheme('light')}
              preview={<MockWindow variant="light" />}
              icon={<SunIcon />}
            />
            <ThemeCard
              label="Dark"
              selected={mounted && theme === 'dark'}
              onClick={() => applyTheme('dark')}
              preview={<MockWindow variant="dark" />}
              icon={<MoonIcon />}
            />
            <ThemeCard
              label="System"
              selected={mounted && theme === 'system'}
              onClick={() => applyTheme('system')}
              preview={<MockWindow variant="system" />}
              icon={<MonitorIcon />}
            />
          </div>
        </div>

        {/* Font */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">Font</h3>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Affects all text in the app
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FontCard
              selected={mounted && font === 'bricolage'}
              onClick={() => applyFont('bricolage')}
              title="Bricolage Grotesque"
              subtitle="Friendly, rounded display."
              titleStyle={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                letterSpacing: 0,
              }}
            />
            <FontCard
              selected={mounted && font === 'geist-tight'}
              onClick={() => applyFont('geist-tight')}
              title="Geist (tight)"
              subtitle="Cleaner, more compact."
              titleStyle={{
                fontFamily: `var(--font-geist-sans, 'Geist'), system-ui, sans-serif`,
                letterSpacing: '-0.03em',
              }}
              titleClassName={GeistSans.className}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ThemeCard({
  label,
  selected,
  onClick,
  preview,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  preview: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'group relative text-left border rounded-2xl p-5 cursor-pointer transition-all',
        selected
          ? 'border-pink-500 dark:border-pink-400 ring-2 ring-pink-500/20'
          : 'border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#3f3f3f]',
        'bg-white dark:bg-[#111111]',
      ].join(' ')}
    >
      <div className="mb-4">{preview}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-zinc-100">
          <span className="text-gray-500 dark:text-zinc-400">{icon}</span>
          {label}
        </div>
        {selected && <CheckBadge />}
      </div>
    </button>
  );
}

function FontCard({
  selected,
  onClick,
  title,
  subtitle,
  titleStyle,
  titleClassName,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  titleStyle?: React.CSSProperties;
  titleClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'group relative text-left border rounded-2xl p-5 cursor-pointer transition-all',
        selected
          ? 'border-pink-500 dark:border-pink-400 ring-2 ring-pink-500/20'
          : 'border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#3f3f3f]',
        'bg-white dark:bg-[#111111]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={['text-xl font-semibold text-gray-900 dark:text-zinc-100', titleClassName ?? '']
            .join(' ')
            .trim()}
          style={titleStyle}
        >
          {title}
        </div>
        {selected && <CheckBadge />}
      </div>
      <p className="text-xs text-gray-500 dark:text-zinc-400">{subtitle}</p>
      <div
        className="mt-4 text-sm text-gray-600 dark:text-zinc-300"
        style={titleStyle}
      >
        The quick brown fox jumps over the lazy dog.
      </div>
    </button>
  );
}

function MockWindow({ variant }: { variant: 'light' | 'dark' | 'system' }) {
  if (variant === 'system') {
    return (
      <div className="relative h-20 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-[#262626]">
        <div className="absolute inset-0 grid grid-cols-2">
          <MockWindow variant="light" />
          <MockWindow variant="dark" />
        </div>
      </div>
    );
  }
  const isDark = variant === 'dark';
  return (
    <div
      className={[
        'h-20 w-full rounded-lg border overflow-hidden',
        isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-gray-200',
      ].join(' ')}
    >
      <div
        className={[
          'h-3 w-full flex items-center gap-1 px-1.5',
          isDark ? 'bg-[#111111] border-b border-[#1f1f1f]' : 'bg-gray-50 border-b border-gray-100',
        ].join(' ')}
      >
        <span className="block h-1.5 w-1.5 rounded-full bg-pink-400/70" />
        <span className={`block h-1.5 w-1.5 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-gray-200'}`} />
        <span className={`block h-1.5 w-1.5 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-gray-200'}`} />
      </div>
      <div className="p-2 space-y-1.5">
        <div className={`h-1.5 w-2/3 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-gray-200'}`} />
        <div className={`h-1.5 w-1/2 rounded-full ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`} />
        <div className={`h-1.5 w-3/5 rounded-full ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`} />
      </div>
    </div>
  );
}

function CheckBadge() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white">
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3 3 7-7" />
      </svg>
    </span>
  );
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17v2m6-2v2M5 4h14a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
      />
    </svg>
  );
}
