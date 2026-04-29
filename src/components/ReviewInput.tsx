import React from "react";
import { cn } from "../lib/utils";

interface ReviewInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  language: "en" | "ar";
}

export function ReviewInput({ value, onChange, language }: ReviewInputProps) {
  const isArabic = language === "ar";

  return (
    <div className={cn("flex flex-col w-full", isArabic && "rtl")}>
      <textarea
        id="reviews"
        value={value}
        onChange={onChange}
        dir={isArabic ? "rtl" : "ltr"}
        placeholder={
          isArabic
            ? "الصق مراجعات المنتج هنا (واحدة في كل سطر)..."
            : "Paste product reviews here (one per line)..."
        }
        className="min-h-[100px] w-full bg-transparent dark:bg-black/10 rounded-xl p-3 text-base text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-300 focus-visible:outline-none resize-none"
      />
    </div>
  );
}
