import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TourStep } from "./tourSteps";

interface TourOverlayProps {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

/**
 * Full-screen overlay with SVG mask spotlight, progress bar, keyboard nav,
 * swipe support, and animated transitions.
 *
 * Uses a continuous RAF loop to keep the spotlight perfectly synced with the
 * target element's position — even during scrolling, resizing, or layout shifts.
 */
export function TourOverlay({ steps, currentStep, onNext, onPrev, onSkip }: TourOverlayProps) {
  // Live rect updated every frame via RAF
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const rectRef = useRef(rect); // avoid stale closures in RAF
  rectRef.current = rect;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const swipeX = useMotionValue(0);
  const swipeOpacity = useTransform(swipeX, [-120, 0, 120], [0.5, 1, 0.5]);

  const step = steps[currentStep];
  const padding = step?.spotlightPadding ?? 8;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // ─── Continuous measurement via RAF ────────────────────────
  useEffect(() => {
    if (!step) return;

    let rafId = 0;
    let scrolledOnce = false;

    const tick = () => {
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        const valid = r.width > 1 && r.height > 1;
        if (valid) {
          const prev = rectRef.current;
          // Only update state when the rect actually changed (avoid re-renders)
          if (
            !prev ||
            Math.abs(prev.x - r.left) > 0.5 ||
            Math.abs(prev.y - r.top) > 0.5 ||
            Math.abs(prev.w - r.width) > 0.5 ||
            Math.abs(prev.h - r.height) > 0.5
          ) {
            setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
          }

          // Scroll into view once per step if needed
          if (!scrolledOnce) {
            scrolledOnce = true;
            const safeBottom = window.innerWidth < 640 ? 80 : 16;
            const pad = 16;
            const inView =
              r.top >= pad && r.bottom <= window.innerHeight - safeBottom - pad;
            if (!inView) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    // Reset rect for the new step so we don't flash the old position
    setRect(null);
    // Small delay to let React flush the null before starting measurements
    const t = setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, 30);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafId);
    };
  }, [currentStep, step]);

  // ─── Keyboard navigation ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      else if (e.key === "ArrowRight" || e.key === "Enter") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext, onPrev, onSkip]);

  // ─── Swipe handler ───────────────────────────────────────
  const handleSwipeEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -50) onNext();
      else if (info.offset.x > 50) onPrev();
    },
    [onNext, onPrev],
  );

  // ─── Tooltip positioning ─────────────────────────────────
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect)
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const isMobile = window.innerWidth < 640;
    const tw = isMobile ? Math.min(280, window.innerWidth - 32) : 300;
    const th = 200;
    const gap = isMobile ? 8 : 12;
    const safeBottom = isMobile
      ? Math.max(80, parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0", 10) + 80)
      : 16;

    let pos = step?.position || "bottom";
    const above = rect.y;
    const below = window.innerHeight - (rect.y + rect.h) - safeBottom;

    if (pos === "bottom" && below < th + gap && above > th + gap) pos = "top";
    if (pos === "top" && above < th + gap && below > th + gap) pos = "bottom";

    let top = 0;
    let left = 0;

    switch (pos) {
      case "top":
        top = rect.y - th - gap;
        left = rect.x + rect.w / 2 - tw / 2;
        break;
      case "bottom":
        top = rect.y + rect.h + gap;
        left = rect.x + rect.w / 2 - tw / 2;
        break;
      case "left":
        top = rect.y + rect.h / 2 - th / 2;
        left = rect.x - tw - gap;
        break;
      case "right":
        top = rect.y + rect.h / 2 - th / 2;
        left = rect.x + rect.w + gap;
        break;
    }

    const maxTop = window.innerHeight - th - safeBottom;
    top = Math.max(16, Math.min(top, maxTop));
    left = Math.max(16, Math.min(left, window.innerWidth - tw - 16));

    return { top: `${top}px`, left: `${left}px` };
  };

  if (!step) return null;

  // While the element hasn't been found yet, show a loading overlay
  if (!rect) {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-white/60">Laden...</p>
        </div>
      </div>
    );
  }

  // Spotlight cut-out with padding
  const cx = rect.x - padding;
  const cy = rect.y - padding;
  const cw = rect.w + padding * 2;
  const ch = rect.h + padding * 2;

  return (
    <>
      {/* ── SVG Mask Overlay ──────────────────────────────── */}
      <svg
        className="fixed inset-0 w-full h-full z-[9998] pointer-events-auto"
        onClick={onSkip}
        aria-hidden
      >
        <defs>
          <mask id="tour-spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={cx}
              y={cy}
              width={cw}
              height={ch}
              rx={12}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-spotlight)"
        />
      </svg>

      {/* ── Spotlight border ring ────────────────────────── */}
      <div
        className="fixed z-[9999] border-2 border-primary rounded-xl pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: cy,
          left: cx,
          width: cw,
          height: ch,
          boxShadow:
            "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.3)",
        }}
      />

      {/* ── Allow clicking the highlighted element ──────── */}
      <div
        className="fixed z-[9999]"
        style={{
          top: rect.y,
          left: rect.x,
          width: rect.w,
          height: rect.h,
          pointerEvents: "auto",
        }}
      />

      {/* ── Tooltip ───────────────────────────────────────── */}
      <motion.div
        ref={tooltipRef}
        key={`tooltip-${currentStep}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleSwipeEnd}
        style={{ x: swipeX, opacity: swipeOpacity, ...getTooltipStyle() }}
        className="fixed z-[10000] w-[calc(100vw-32px)] sm:w-[300px] max-w-[300px] p-4 bg-card border border-border rounded-2xl shadow-xl touch-pan-y"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-muted mb-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Tour schließen"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="font-bold text-lg mb-2">{step.title}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück
          </Button>

          <Button size="sm" onClick={onNext} className="gap-1">
            {currentStep === steps.length - 1 ? "Fertig" : "Weiter"}
            {currentStep < steps.length - 1 && (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Skip link */}
        <button
          onClick={onSkip}
          className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
        >
          Tour überspringen
        </button>
      </motion.div>
    </>
  );
}
