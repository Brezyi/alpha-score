import confetti from "canvas-confetti";

type ConfettiType = "celebration" | "achievement" | "streak" | "levelUp";

const confettiPresets: Record<ConfettiType, () => void> = {
  celebration: () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#ff0a54", "#ff477e", "#ff7096", "#ff85a1", "#fbb1bd"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  },

  achievement: () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ffd700", "#ffb347", "#ff6961", "#77dd77", "#84b6f4"],
    });
  },

  streak: () => {
    const colors = ["#ff6b35", "#f7931e", "#ffcc02"];
    
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 45,
      origin: { x: 0.5, y: 0.7 },
      colors,
      shapes: ["circle"],
      scalar: 1.2,
    });
  },

  levelUp: () => {
    const duration = 1500;
    const end = Date.now() + duration;
    const colors = ["#a855f7", "#8b5cf6", "#7c3aed", "#6366f1"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.65 },
        colors,
        shapes: ["star"],
        scalar: 1.5,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.65 },
        colors,
        shapes: ["star"],
        scalar: 1.5,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  },
};

export function triggerConfetti(type: ConfettiType = "celebration") {
  confettiPresets[type]();
}

export function useConfetti() {
  return {
    celebrate: () => triggerConfetti("celebration"),
    achievement: () => triggerConfetti("achievement"),
    streak: () => triggerConfetti("streak"),
    levelUp: () => triggerConfetti("levelUp"),
  };
}
