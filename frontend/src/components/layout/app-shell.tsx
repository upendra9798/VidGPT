import { NavLink } from 'react-router-dom';
import { BarChart3, BookOpen, History, Layers3, Search, Settings, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/collections', label: 'Collections', icon: Layers3 },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[image:var(--tw-gradient-stops)]">
      <div className="fixed inset-0 -z-10 bg-mesh-light dark:bg-mesh-dark" />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 border-r border-border/70 bg-card/80 p-6 backdrop-blur xl:flex xl:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">YoutuLearn AI</div>
              <div className="text-xs text-muted-foreground">Learn Anything from YouTube with AI</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-border bg-card p-5 shadow-glow">
            <div className="mb-2 text-sm font-semibold">Theme</div>
            <p className="mb-4 text-sm text-muted-foreground">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
            <Button variant="outline" className="w-full" onClick={toggleTheme}>
              Toggle theme
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 px-4 py-4 backdrop-blur xl:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">YoutuLearn AI</p>
                <h1 className="font-display text-xl font-semibold">AI-powered learning workspace</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === 'dark' ? 'Light' : 'Dark'} mode
                </Button>
              </div>
            </div>
          </header>
          <div className="px-4 py-6 xl:px-8 xl:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
