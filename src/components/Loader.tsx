import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Analyzing reviews...
      </p>
    </div>
  );
}
