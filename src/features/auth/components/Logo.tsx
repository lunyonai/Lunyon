import { Bot } from "lucide-react";

type LogoProps = {
  showTagline?: boolean;
  compact?: boolean;
};

export default function Logo({
  showTagline = true,
  compact = false,
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/60 ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <Bot className={compact ? "h-4 w-4 text-white" : "h-5 w-5 text-white"} />
      </div>

      <div>
        <p
          className={`font-semibold tracking-tight text-white ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          AI Employee
        </p>

        {showTagline && (
          <p className="text-xs text-slate-400">Your AI Operating System</p>
        )}
      </div>
    </div>
  );
}