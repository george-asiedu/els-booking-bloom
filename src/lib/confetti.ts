import confetti from "canvas-confetti";

// Celebratory burst for successful payments.
export const celebrate = () => {
  const colors = ["#be185d", "#f472b6", "#fbbf24", "#34d399"];
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });

  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};
