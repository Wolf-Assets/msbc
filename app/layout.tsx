import type { Metadata } from 'next';
import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { NavLink } from './NavLink';
import { ThemeToggle } from './ThemeToggle';

export const metadata: Metadata = {
  title: 'Mighty Sweet Baking Co.',
  description: 'Inventory Manager',
};

const themeInitScript = `
(function(){try{
  var t=localStorage.getItem('theme');
  var f=localStorage.getItem('font');
  var d=document.documentElement;
  var sysDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(t==='dark'){d.classList.add('dark');}
  else if(t==='light'){d.classList.remove('dark');}
  else{if(sysDark)d.classList.add('dark');else d.classList.remove('dark');}
  if(f==='geist-tight') d.classList.add('font-geist-tight');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="https://mightysweetbakingco.com/wp-content/uploads/2025/07/logo-1.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-white dark:bg-black min-h-screen antialiased">
        {/* Header */}
        <header className="bg-white dark:bg-black sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img
                src="https://mightysweetbakingco.com/wp-content/uploads/2025/07/logo-1.png"
                alt="Mighty Sweet Baking Co."
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Mighty Sweet Baking Co.</h1>
                <p className="text-xs text-pink-500 font-medium">Inventory Manager</p>
              </div>
            </a>

            <div className="flex items-center gap-2">
              <nav className="flex gap-1">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/flavors">Flavors</NavLink>
                <NavLink href="/events">Events</NavLink>
                <NavLink href="/deliveries">Deliveries</NavLink>
                <NavLink href="/activity">Activity</NavLink>
              </nav>
              <div className="w-px h-6 bg-gray-200 dark:bg-[#262626] mx-2" />
              <ThemeToggle />
              <a
                href="/settings"
                aria-label="Settings"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#1f1f1f] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
