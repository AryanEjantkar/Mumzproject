import { useState, useEffect } from "react";

import { LanguageToggle } from "./components/LanguageToggle";
import { ReviewInput } from "./components/ReviewInput";
import { GenerateButton } from "./components/GenerateButton";
import { VerdictCard, type VerdictData } from "./components/VerdictCard";
import { Loader } from "./components/Loader";
import { AlertTriangle, Sparkles, Moon, Sun } from "lucide-react";
import { generateVerdict } from "./lib/ai";

const MOCK_VERDICT_EN: VerdictData = {
  pros: [
    "High quality materials and very durable.",
    "Easy to clean and maintain.",
    "Baby sleeps soundly through the night."
  ],
  cons: [
    "A bit bulky for travel.",
    "Price is slightly higher than competitors."
  ],
  sentimentScore: 85,
  verdict: "Overall, an excellent product for daily home use. While it's slightly expensive and bulky, the durability and comfort it provides make it highly recommended by most mothers.",
  confidenceScore: 92,
};

const MOCK_VERDICT_AR: VerdictData = {
  pros: [
    "مواد عالية الجودة ومتينة للغاية.",
    "سهل التنظيف والصيانة.",
    "ينام الطفل بعمق طوال الليل."
  ],
  cons: [
    "كبير الحجم قليلاً للسفر.",
    "السعر أعلى قليلاً من المنافسين."
  ],
  sentimentScore: 85,
  verdict: "بشكل عام، منتج ممتاز للاستخدام المنزلي اليومي. على الرغم من أنه غالي الثمن وضخم قليلاً، إلا أن المتانة والراحة التي يوفرها تجعله موصى به بشدة من قبل معظم الأمهات.",
  confidenceScore: 92,
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [reviews, setReviews] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleGenerate = async () => {
    if (!reviews.trim()) return;
    setIsLoading(true);
    setVerdict(null);
    setError(null);

    try {
      const result = await generateVerdict(reviews, language);
      setVerdict(result);
    } catch (err: any) {
      setError(err.message || "Something went wrong while generating the verdict.");
    } finally {
      setIsLoading(false);
    }
  };

  const isArabic = language === "ar";
  const isLowConfidence = verdict && verdict.confidenceScore < 50;

  return (
    <div className="min-h-screen transition-colors duration-300 antialiased selection:bg-primary/30 selection:text-primary-foreground flex flex-col">
      <div className="max-w-[600px] mx-auto px-4 pb-16 w-full flex-grow relative">
        
        {/* Dark mode toggle at top right (page end) */}
        <div className="absolute right-4 top-6 sm:right-0 sm:top-8 z-50">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
        
        <main className="mt-8 space-y-6 animate-in fade-in duration-500 flex flex-col items-center text-center">
          
          {/* Brand Header Stack */}
          <div className="flex flex-col items-center justify-center gap-4">
            <img 
              src="/logo.png" 
              alt="ReviewNest Logo" 
              className="h-32 object-contain drop-shadow-sm mix-blend-multiply dark:mix-blend-normal" 
            />
            <h1 className="text-5xl font-extrabold tracking-tight text-primary">
              ReviewNest
            </h1>
          </div>

          <div className="space-y-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-bold tracking-wider uppercase mt-2">
              <Sparkles className="w-4 h-4" />
              Empathetic Intelligence
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight">
              Understand what real moms think — instantly
            </h2>
            
            <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed px-4">
              Paste product reviews and let our AI distill thousands of experiences into a single, reliable verdict.
            </p>
          </div>

          <div className="w-full">
            <div className="bg-card border-2 border-border rounded-[2rem] p-4 pb-16 relative shadow-sm">
              <ReviewInput 
                value={reviews}
                onChange={(e) => setReviews(e.target.value)}
                language={language}
              />

              {/* Bottom bar of the input card */}
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-10">
                <LanguageToggle language={language} setLanguage={setLanguage} />
                
                <div className="absolute -right-10 -bottom-4">
                  <GenerateButton 
                    isLoading={isLoading}
                    onClick={handleGenerate}
                    disabled={reviews.trim().length === 0}
                    language={language}
                  />
                </div>
              </div>
            </div>

            {/* Error / Empty state handled by disabled button */}
            {reviews.trim().length === 0 && !isLoading && !verdict && (
              <p className="text-sm text-muted-foreground flex justify-center mt-8 animate-pulse">
                {isArabic ? "يرجى إدخال المراجعات للبدء." : "Please enter reviews to begin."}
              </p>
            )}
          </div>

          <div className="w-full text-left">
            {isLoading && (
              <div className="mt-12 flex justify-center">
                <Loader />
              </div>
            )}

            {error && !isLoading && (
              <div className="mt-8 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!isLoading && verdict && !error && (
              <>
                {isLowConfidence && (
                  <div className="mt-8 flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-xl">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {isArabic 
                        ? "ليس هناك بيانات كافية أو متسقة لتوليد حكم قوي." 
                        : "Not enough consistent data to generate a strong verdict."}
                    </p>
                  </div>
                )}
                <VerdictCard data={verdict} language={language} />
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
