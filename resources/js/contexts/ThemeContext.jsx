import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'bacii_studyhub.theme';

const ThemeContext = createContext(null);

function systemPrefersDark() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function resolveTheme(theme) {
    if (theme === 'system') {
        return systemPrefersDark() ? 'dark' : 'light';
    }

    return theme;
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system');
    const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme));

    useEffect(() => {
        const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
        const onChange = () => setResolvedTheme(resolveTheme(theme));

        mediaQuery?.addEventListener('change', onChange);

        return () => mediaQuery?.removeEventListener('change', onChange);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, theme);
        const activeTheme = resolveTheme(theme);
        setResolvedTheme(activeTheme);
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.style.colorScheme = activeTheme;
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (resolveTheme(current) === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(() => ({ theme, setTheme, resolvedTheme, toggleTheme }), [theme, resolvedTheme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return context;
}
