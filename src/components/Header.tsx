import { Moon, Sun } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Header({ isDarkMode, toggleDarkMode }: HeaderProps) {
  return (
    <header className="relative flex items-center justify-between py-6">
      {/* Spacer to maintain flex layout balance */}
      <div className="w-9" /> 
      
      {/* Logo moved to App.tsx main content */}
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-full hover:bg-secondary transition-colors focus-ring"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-foreground" />
        ) : (
          <Moon className="w-5 h-5 text-foreground" />
        )}
      </button>
    </header>
  );
}
