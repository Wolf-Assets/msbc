'use client';

import { usePathname } from 'next/navigation';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'text-pink-600 bg-pink-50'
          : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
      }`}
    >
      {children}
    </a>
  );
}
