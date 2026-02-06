import type { Metadata } from 'next';
import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mighty Sweets Baking Co.',
  description: 'Inventory Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="https://mightysweetbakingco.com/wp-content/uploads/2025/07/logo-1.png" />
      </head>
      <body className="bg-white min-h-screen antialiased">
        {/* Header */}
        <header className="bg-white sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://mightysweetbakingco.com/wp-content/uploads/2025/07/logo-1.png"
                alt="Mighty Sweets Baking Co."
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mighty Sweets Baking Co.</h1>
                <p className="text-xs text-pink-500 font-medium">Inventory Manager</p>
              </div>
            </div>

            <nav className="flex gap-1">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/flavors">Flavors</NavLink>
              <NavLink href="/events">Events</NavLink>
            </nav>
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
    >
      {children}
    </a>
  );
}
