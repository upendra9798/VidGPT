import { createContext, useContext } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) {
  return <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>;
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex gap-2 rounded-2xl border border-border bg-muted p-1', className)} {...props} />;
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used inside Tabs');
  const active = context.value === value;
  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used inside Tabs');
  if (context.value !== value) return null;
  return <div className={className}>{children}</div>;
}
