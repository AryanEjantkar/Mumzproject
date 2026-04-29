import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface GenerateButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled: boolean;
  language: "en" | "ar";
}

export function GenerateButton({ isLoading, onClick, disabled, language }: GenerateButtonProps) {
  const isArabic = language === "ar";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d946ef] to-[#a855f7] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all focus-ring hover:shadow-xl hover:scale-105",
        disabled || isLoading ? "opacity-70 cursor-not-allowed scale-100" : "",
        isArabic && "flex-row-reverse"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {isArabic ? "جاري تحليل المراجعات..." : "Analyzing reviews..."}
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          {isArabic ? "إنشاء الحكم النهائي" : "Generate Verdict"}
        </>
      )}
    </button>
  );
}
