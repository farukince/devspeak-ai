'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Menu, PanelLeftClose, PanelLeftOpen, Sparkles, X } from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  APP_NAV_ITEMS,
  APP_SECONDARY_NAV_ITEMS,
  isNavItemActive,
} from '@/lib/navigation/app-nav';
import { cn } from '@/lib/utils';

const SIDEBAR_KEY = 'devspeak.sidebar.collapsed';

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = [...APP_NAV_ITEMS, ...APP_SECONDARY_NAV_ITEMS];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-theme',
              collapsed && 'justify-center px-2',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarChrome({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center gap-2 border-b border-sidebar-border px-3', collapsed && 'justify-center')}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn('flex min-w-0 items-center gap-2 font-semibold text-sidebar-foreground', collapsed && 'justify-center')}
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          {!collapsed && <span className="truncate">DevSpeak AI</span>}
        </Link>
        {onToggle && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {onToggle && collapsed && (
        <div className="flex justify-center border-b border-sidebar-border py-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      )}

      <NavLinks collapsed={collapsed} onNavigate={onNavigate} />

      <div className={cn('space-y-3 border-t border-sidebar-border p-3', collapsed && 'px-2')}>
        {!collapsed && <ThemeToggle />}
        {collapsed && <ThemeToggle compact className="mx-auto" />}
        <LogoutButton
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400',
            collapsed && 'justify-center px-2'
          )}
          iconOnly={collapsed}
        >
          Logout
        </LogoutButton>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-sidebar lg:flex lg:flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarChrome collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md border border-border p-2 text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4" />
            DevSpeak AI
          </Link>
          <div className="ml-auto">
            <ThemeToggle compact />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <Dialog open={mobileOpen} onClose={setMobileOpen} className="relative z-50 lg:hidden">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="flex h-full w-72 flex-col bg-sidebar shadow-xl transition-sidebar">
            <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-3">
              <DialogTitle className="text-sm font-semibold text-sidebar-foreground">Navigation</DialogTitle>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarChrome collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
