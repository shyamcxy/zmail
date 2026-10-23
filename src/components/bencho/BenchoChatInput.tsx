import React, { useState, useRef, useEffect } from "react";
import { Plus, Check, Mic, ArrowUp } from "lucide-react";
import { tactile } from "../../lib/tactileAudio";

interface BenchoChatInputProps {
  placeholder?: string;
  onSend: (text: string, model: string, effort: string) => void;
  onAttachContext?: () => void;
  isProcessing?: boolean;
}

const MODELS = ["Qwen 2.5 3B (Local)", "Llama 3.1 8B", "Fast Triage"];
const EFFORT_LEVELS = ["Low", "Medium", "High"];

export const BenchoChatInput: React.FC<BenchoChatInputProps> = ({
  placeholder = "Ask anything…",
  onSend,
  onAttachContext,
  isProcessing = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [value, setValue] = useState("");
  const [modelIndex, setModelIndex] = useState(0);
  const [effortIndex, setEffortIndex] = useState(1); // Default "Medium"

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsMenuOpen(false);
        if (!value.trim()) {
          setIsOpen(false);
          tactile.tamp();
        }
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen, value]);

  const handleExpand = () => {
    if (!isOpen) {
      setIsOpen(true);
      tactile.expand();
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;

    tactile.pop();
    onSend(trimmed, MODELS[modelIndex], EFFORT_LEVELS[effortIndex]);
    setValue("");
    inputRef.current?.focus({ preventScroll: true });
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="aci select-none">
      <div
        ref={containerRef}
        className="aci-box"
        data-open={isOpen || undefined}
        onPointerDown={handleExpand}
      >
        <input
          ref={inputRef}
          className="aci-field"
          placeholder={placeholder}
          aria-label="Message"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleExpand}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            } else if (e.key === "Escape") {
              if (isMenuOpen) {
                setIsMenuOpen(false);
              } else if (!value) {
                setIsOpen(false);
                inputRef.current?.blur();
              }
            }
          }}
        />

        {/* Bottom Expandable Toolset (Model, Effort, Attach) */}
        <div className="aci-tools" aria-hidden={!isOpen}>
          {/* Attach Context Button */}
          <button
            type="button"
            className="aci-tool aci-icon"
            tabIndex={isOpen ? 0 : -1}
            aria-label="Attach current email context"
            title="Attach email context"
            onClick={(e) => {
              e.stopPropagation();
              tactile.click();
              onAttachContext?.();
            }}
          >
            <Plus size={15} strokeWidth={2.2} />
          </button>

          {/* Model Selector Popover */}
          <span className="aci-pick">
            <button
              type="button"
              className="aci-tool"
              tabIndex={isOpen ? 0 : -1}
              aria-haspopup="listbox"
              aria-expanded={isMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
                tactile.click();
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10A37F] mr-0.5" />
              {MODELS[modelIndex]}
            </button>

            <span
              className="aci-menu"
              role="listbox"
              aria-label="Model"
              data-on={isMenuOpen || undefined}
            >
              {MODELS.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  role="option"
                  aria-selected={idx === modelIndex}
                  className="aci-opt"
                  tabIndex={isMenuOpen ? 0 : -1}
                  data-on={idx === modelIndex || undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModelIndex(idx);
                    setIsMenuOpen(false);
                    tactile.click();
                  }}
                >
                  <span>{m}</span>
                  {idx === modelIndex && (
                    <Check size={13} strokeWidth={2.5} className="text-[#10A37F]" />
                  )}
                </button>
              ))}
            </span>
          </span>

          {/* Effort Dial (Low, Medium, High) */}
          <button
            type="button"
            className="aci-tool"
            tabIndex={isOpen ? 0 : -1}
            aria-label={`Reasoning Effort: ${EFFORT_LEVELS[effortIndex]}`}
            onClick={(e) => {
              e.stopPropagation();
              setEffortIndex((prev) => (prev + 1) % EFFORT_LEVELS.length);
              tactile.click();
            }}
          >
            <span className="aci-bars" aria-hidden="true">
              {[0, 1, 2].map((lvl) => (
                <i key={lvl} data-on={lvl <= effortIndex || undefined} />
              ))}
            </span>
            <span>{EFFORT_LEVELS[effortIndex]}</span>
          </button>
        </div>

        {/* Morphing Mic to Send Arrow Button */}
        <button
          type="button"
          className="aci-go"
          data-full={hasContent || undefined}
          aria-label={hasContent ? "Send message" : "Voice dictate"}
          title={hasContent ? "Send (Enter)" : "Dictate"}
          onClick={(e) => {
            e.stopPropagation();
            if (hasContent) {
              handleSend();
            } else {
              tactile.click();
            }
          }}
        >
          <Mic className="aci-mic text-zinc-500" size={15} strokeWidth={2} />
          <ArrowUp className="aci-up" size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
