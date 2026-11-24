import confetti from "canvas-confetti";

// Celebratory burst for successful payments.
export const celebrate = () => {
  const colors = ["#FBC500", "#FDE48A", "#FFFFFF", "#1ABD8C"];
  // Above dialogs, overlays and the payment popup's fade-out.
  const base = { zIndex: 10000, disableForReducedMotion: false };
  confetti({ ...base, particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });

  const end = Date.now() + 700;
  (function frame() {
    confetti({ ...base, particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ ...base, particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};
