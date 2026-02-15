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
 */
export function TourOverlay({ steps, currentStep, onNext, onPrev, onSkip }: TourOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const swipeX = useMotionValue(0);
  const swipeOpacity = useTransform(swipeX, [-120, 0, 120], [0.5, 1, 0.5]);

  const currentStepData = steps[currentStep];
  const padding = currentStepData?.spotlightPadding ?? 8;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // ─── Measure target ──────────────────────────────────────
  useEffect(() => {
    if (!currentStepData) return;

    const resolveTarget = () =>
      document.querySelector(currentStepData.target) as HTMLElement | null;

    const updateRect = () => {
      const el = resolveTarget();
      if (!el) {
        setTargetRect(null);
        return;
      }
      setTargetRect(el.getBoundingClientRect());
    };

    const ensureInView = () => {
      const el = resolveTarget();
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const safeBottom = window.innerWidth < 640 ? 80 : 16;
      const pad = 16;
      const visible =
        rect.top >= pad && rect.bottom <= window.innerHeight - safeBottom - pad;
      if (!visible) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    let rafId = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateRect);
    };

    const t0 = setTimeout(() => { updateRect(); ensureInView(); }, 100);
    const t1 = setTimeout(updateRect, 300);
    const t2 = setTimeout(updateRect, 700);

    window.addEventListener("resize", onViewportChange, { passive: true } as AddEventListenerOptions);
    window.addEventListener("scroll", onViewportChange, { passive: true, capture: true } as AddEventListenerOptions);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, { capture: true } as EventListenerOptions);
    };
  }, [currentStep, currentStepData]);

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
    if (!targetRect)
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const isMobile = window.innerWidth < 640;
    const tw = isMobile ? Math.min(280, window.innerWidth - 32) : 300;
    const th = 200;
    const gap = isMobile ? 8 : 12;
    const safeBottom = isMobile
      ? Math.max(80, parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0", 10) + 80)
      : 16;

    let pos = currentStepData?.position || "bottom";
    const above = targetRect.top;
    const below = window.innerHeight - targetRect.bottom - safeBottom;

    if (pos === "bottom" && below < th + gap && above > th + gap) pos = "top";
    if (pos === "top" && above < th + gap && below > th + gap) pos = "bottom";

    let top = 0;
    let left = 0;

    switch (pos) {
      case "top":
        top = targetRect.top - th - gap;
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        break;
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - th / 2;
        left = targetRect.left - tw - gap;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - th / 2;
        left = targetRect.right + gap;
        break;
    }

    const maxTop = window.innerHeight - th - safeBottom;
    top = Math.max(16, Math.min(top, maxTop));
    left = Math.max(16, Math.min(left, window.innerWidth - tw - 16));

    return { top: `${top}px`, left: `${left}px` };
  };

  if (!currentStepData) return null;

  // SVG spotlight cut-out coordinates
  const cx = targetRect ? targetRect.left - padding : 0;
  const cy = targetRect ? targetRect.top - padding : 0;
  const cw = targetRect ? targetRect.width + padding * 2 : 0;
  const ch = targetRect ? targetRect.height + padding * 2 : 0;

  return (
    <AnimatePresence>
      <>
        {/* ── SVG Mask Overlay ──────────────────────────────── */}
        <motion.svg
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 w-full h-full z-[9998] pointer-events-auto"
          onClick={onSkip}
          aria-hidden
        >
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  x={cx}
                  y={cy}
                  width={cw}
                  height={ch}
                  rx={12}
                  fill="black"
                  initial={false}
                  animate={{ x: cx, y: cy, width: cw, height: ch }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.8)"
            mask="url(#tour-spotlight)"
          />
        </motion.svg>

        {/* ── Spotlight border ring ────────────────────────── */}
        {targetRect && (
          <motion.div
            key="ring"
            className="fixed z-[9999] border-2 border-primary rounded-xl pointer-events-none"
            initial={false}
            animate={{
              top: cy,
              left: cx,
              width: cw,
              height: ch,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              boxShadow:
                "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.3)",
            }}
          />
        )}

        {/* ── Allow clicking the highlighted element ──────── */}
        {targetRect && (
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              pointerEvents: "auto",
            }}
          />
        )}

        {/* ── Tooltip with swipe ──────────────────────────── */}
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
              <h4 className="font-bold text-lg mb-2">{currentStepData.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {currentStepData.description}
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
    </AnimatePresence>
  );
}
