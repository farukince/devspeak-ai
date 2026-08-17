'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn('h-9 w-9 rounded-md border border-border', className)} />;
  }

  if (compact) {
    const current = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    const Icon = themes.find((item) => item.value === theme)?.icon ?? Monitor;
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(current)}
        className={cn('h-9 w-9', className)}
        aria-label="Toggle theme"
      >
        <Icon className="size-4" />
      </Button>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-1 rounded-md border border-border bg-muted p-1', className)}>
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-theme',
            theme === value ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={theme === value}
        >
          <Icon className="size-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
