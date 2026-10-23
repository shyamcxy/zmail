import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { tactile } from "../../lib/tactileAudio";

interface BenchoSlideConfirmProps {
  onConfirm: () => void;
  label?: string;
  confirmedLabel?: string;
  isDestructive?: boolean;
}

export const BenchoSlideConfirm: React.FC<BenchoSlideConfirmProps> = ({
  onConfirm,
  label = "Slide to confirm",
  confirmedLabel = "Confirmed",
  isDestructive = true,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const [maxDistance, setMaxDistance] = useState(200);

  useEffect(() => {
    if (trackRef.current) {
      const trackW = trackRef.current.offsetWidth;
      setMaxDistance(Math.max(100, trackW - 48)); // 40px grip + 8px margins
    }
  }, []);

  // Visual transforms based on drag progress
  const washWidth = useTransform(x, (val) => Math.max(40, val + 40));
  const textOpacity = useTransform(x, [0, maxDistance * 0.5], [1, 0]);
  const gripScale = useTransform(x, [0, maxDistance], [1, 1.04]);

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentX = x.get();
    const threshold = maxDistance * 0.65;

    if (currentX >= threshold) {
      // Completed slide!
      tactile.confirm();
      setIsConfirmed(true);
      animate(x, maxDistance, {
        type: "spring",
        stiffness: 400,
        damping: 32,
      });

      setTimeout(() => {
        onConfirm();
      }, 350);
    } else {
      // Return to start with tactile snap
      tactile.tamp();
      animate(x, 0, {
        type: "spring",
        stiffness: 450,
        damping: 30,
      });
    }
  };

  return (
    <div className="sld select-none w-full">
      <div
        ref={trackRef}
        className="sld-track"
        data-held={isDragging || undefined}
        data-done={isConfirmed || undefined}
      >
        {/* Animated fill wash behind grip */}
        <motion.div
          className="sld-wash"
          style={{
            width: washWidth,
            backgroundColor: isDestructive
              ? "rgba(225, 29, 72, 0.18)"
              : "rgba(16, 163, 127, 0.18)",
          }}
        />

        {/* Track Label */}
        <motion.span
          className="sld-say"
          style={{ opacity: textOpacity }}
        >
          {label}
        </motion.span>

        {/* Draggable Grip Thumb */}
        <motion.button
          type="button"
          className="sld-grip"
          drag={isConfirmed ? false : "x"}
          dragConstraints={{ left: 0, right: maxDistance }}
          dragElastic={0.06}
          onDragStart={() => {
            setIsDragging(true);
            tactile.click();
          }}
          onDragEnd={handleDragEnd}
          style={{
            x,
            scale: gripScale,
            backgroundColor: isConfirmed
              ? "#10A37F"
              : isDestructive
              ? "#E11D48"
              : "#0D0D0D",
          }}
          aria-label={isConfirmed ? confirmedLabel : label}
        >
          {isConfirmed ? (
            <Check size={18} strokeWidth={2.5} className="text-white animate-in zoom-in-75 duration-150" />
          ) : (
            <ArrowRight size={18} strokeWidth={2.5} className="text-white" />
          )}
        </motion.button>
      </div>
    </div>
  );
};
