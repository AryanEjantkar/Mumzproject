import { CheckCircle2, AlertCircle, ShieldCheck, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";

export interface VerdictData {
  pros: string[];
  cons: string[];
  sentimentScore: number; // 0 to 100
  verdict: string;
  confidenceScore: number; // 0 to 100
}

interface VerdictCardProps {
  data: VerdictData;
  language: "en" | "ar";
}

export function VerdictCard({ data, language }: VerdictCardProps) {
  const isArabic = language === "ar";

  return (
    <div className={cn("mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500", isArabic && "rtl")}>
      <div className="rounded-[2rem] border-2 border-border bg-card shadow-sm overflow-hidden p-6 sm:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {isArabic ? "الحكم النهائي" : "Final Verdict"}
            </h2>
            <p className="text-xs font-bold tracking-wider text-primary mt-1.5 uppercase">
              {isArabic ? "ملخص من ١،٢٤٠ مراجعة" : "Summarized from 1,240 Reviews"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-background text-primary px-4 py-2 rounded-full border-2 border-primary/20 w-fit shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-bold">{data.confidenceScore}% {isArabic ? "ثقة" : "Confidence"}</span>
          </div>
        </div>

        {/* Verdict Text */}
        <div className="bg-[#fdf4ff] dark:bg-black/20 rounded-2xl p-6 border border-[#fce7f3] dark:border-white/10">
          <p className="text-[15px] text-foreground leading-relaxed font-medium">
            "{data.verdict}"
          </p>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-[#10b981] flex items-center gap-2 uppercase">
              <CheckCircle2 className="w-4 h-4" />
              {isArabic ? "الإيجابيات" : "The Wins"}
            </h3>
            <ul className="space-y-3">
              {data.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-destructive flex items-center gap-2 uppercase">
              <AlertCircle className="w-4 h-4" />
              {isArabic ? "السلبيات" : "The Trade-Offs"}
            </h3>
            <ul className="space-y-3">
              {data.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sentiment */}
        <div className="border-2 border-border rounded-[2rem] p-8 flex flex-col items-center justify-center space-y-6">
          <h3 className="text-xs font-bold tracking-widest text-foreground uppercase">
            {isArabic ? "المشاعر العامة" : "Overall Sentiment"}
          </h3>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--secondary)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - data.sentimentScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-foreground">{data.sentimentScore}%</span>
            </div>
          </div>

          <div className="bg-[#10b981]/10 text-[#10b981] px-4 py-1.5 rounded-full text-xs font-bold">
            {isArabic ? "موصى به بشدة" : "Highly Recommended"}
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-[#fdf4ff] dark:bg-black/20 rounded-[1.5rem] p-6 border border-[#fce7f3] dark:border-white/10 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Lightbulb className="w-24 h-24" />
          </div>
          <h3 className="text-xs font-bold tracking-widest text-primary flex items-center gap-1.5 uppercase">
            <Lightbulb className="w-4 h-4" />
            {isArabic ? "رؤية الذكاء الاصطناعي" : "AI Insight"}
          </h3>
          <p className="text-[14px] text-foreground font-medium italic relative z-10 leading-relaxed">
            {isArabic 
              ? "\"معظم المراجعات تسلط الضوء على سهولة الاستخدام كعامل رئيسي في رضا العملاء.\""
              : "\"Most reviews highlight the ease of use and overall quality as key factors in customer satisfaction.\""}
          </p>
          <div className="flex gap-2 pt-2 relative z-10">
            <span className="text-[11px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold">#QualityInsights</span>
            <span className="text-[11px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold">#UserFavorite</span>
          </div>
        </div>
      </div>
    </div>
  );
}
