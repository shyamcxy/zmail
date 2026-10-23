import React from "react";
import { Sparkles } from "lucide-react";

interface BenchoThinkingProps {
  label?: string;
  className?: string;
}

export const BenchoThinking: React.FC<BenchoThinkingProps> = ({
  label = "Synthesizing with local Ollama Llama 3.1 8B...",
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 py-1 select-none ${className}`}>
      {/* Bencho Dot Breathing Indicator */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10A37F] opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10A37F]" />
      </span>

      {/* Bencho Shimmering Text */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={13} className="text-[#10A37F] animate-spin" style={{ animationDuration: "3s" }} />
        <span className="text-xs font-medium bencho-shimmer tracking-tight">
          {label}
        </span>
      </div>
    </div>
  );
};
