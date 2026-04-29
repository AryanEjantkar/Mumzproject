import { Languages } from "lucide-react";
import { cn } from "../lib/utils";

interface LanguageToggleProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
}

export function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className={cn(
        "flex items-center gap-2 bg-secondary text-primary px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-primary/10 focus-ring w-fit"
      )}
    >
      <Languages className="w-4 h-4" />
      <span>{language === "en" ? "English / العربية" : "العربية / English"}</span>
    </button>
  );
}
