import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'default' | 'auth';
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'auth') {
    return (
      <button
        onClick={toggleTheme}
        className="w-10 h-10 bg-card/90 cursor-pointer dark:bg-white/10 backdrop-blur-lg border border-border dark:border-white/20 rounded-xl flex items-center justify-center hover:bg-card dark:hover:bg-white/20 transition-all duration-200 shadow-sm"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon size={20} className="text-foreground dark:text-white" />
        ) : (
          <Sun size={20} className="text-foreground dark:text-white" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 cursor-pointer bg-secondary rounded-full transition-all duration-300 hover:bg-muted"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white dark:bg-card rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {theme === 'light' ? (
          <Sun size={14} className="text-primary" />
        ) : (
          <Moon size={14} className="text-primary" />
        )}
      </div>
    </button>
  );
}
