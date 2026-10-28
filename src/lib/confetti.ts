import confetti from "canvas-confetti";

// Celebratory burst for successful payments.
export const celebrate = () => {
  const colors = ["#FBC500", "#FDE48A", "#101720", "#1ABD8C"];
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });

  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};
