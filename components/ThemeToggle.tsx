'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="rounded-full p-2 hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 transition-colors">
                <span className="sr-only">Toggle theme</span>
                <div className="size-5" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full p-2 hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 transition-colors relative group"
            aria-label="Toggle theme"
        >
            <span className="sr-only">Toggle theme</span>
            {theme === 'dark' ? (
                <span className="material-symbols-outlined text-xl">light_mode</span>
            ) : (
                <span className="material-symbols-outlined text-xl">dark_mode</span>
            )}
        </button>
    );
}
