"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const imageWidth = 1536;
const imageHeight = 1024;

// Each cubic curve follows a branch in the hero illustration.
const branches = [
  { points: [1200, 520, 1030, 548, 893, 568, 790, 663], duration: 2200, delay: 0 },
  { points: [1185, 570, 1025, 685, 1075, 834, 905, 924], duration: 2750, delay: 680 },
  { points: [1150, 435, 1055, 308, 900, 372, 835, 214], duration: 2520, delay: 1180 },
  { points: [1260, 460, 1440, 329, 1315, 225, 1450, 157], duration: 2550, delay: 380 },
  { points: [1310, 563, 1440, 573, 1470, 609, 1536, 638], duration: 1600, delay: 1340 },
  { points: [1265, 599, 1326, 681, 1435, 675, 1465, 743], duration: 2080, delay: 1920 },
];

function pointOnBranch(points: number[], progress: number) {
  const remaining = 1 - progress;
  const start = remaining ** 3;
  const first = 3 * remaining ** 2 * progress;
  const second = 3 * remaining * progress ** 2;
  const end = progress ** 3;
  return [
    start * points[0] + first * points[2] + second * points[4] + end * points[6],
    start * points[1] + first * points[3] + second * points[5] + end * points[7],
  ];
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const narrowScreen = matchMedia("(max-width: 800px)");
    let visible = false;
    let frame = 0;
    let started: number | undefined;
    let scale = 1;
    let left = 0;
    let top = 0;
    let pixelRatio = 1;

    function clear() {
      if (!canvas || !context) return;
      context.resetTransform();
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function resize() {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      pixelRatio = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      scale = Math.max(width / imageWidth, height / imageHeight);
      left = (width - imageWidth * scale) * (narrowScreen.matches ? 0.78 : 0.5);
      top = (height - imageHeight * scale) * (narrowScreen.matches ? 0.5 : 0.52);
    }

    function draw(now: number) {
      if (!context) return;
      started ??= now;
      clear();
      context.setTransform(scale * pixelRatio, 0, 0, scale * pixelRatio, left * pixelRatio, top * pixelRatio);

      for (const { points, duration, delay } of branches) {
        const elapsed = now - started - delay;
        const progress = (elapsed % (duration + 440)) / duration;
        if (progress < 0 || progress > 1) continue;

        const intensity = Math.min(progress * 9, (1 - progress) * 9, 1);
        const [headX, headY] = pointOnBranch(points, progress);
        const [tailX, tailY] = pointOnBranch(points, Math.max(0, progress - 0.27));
        const trail = context.createLinearGradient(tailX, tailY, headX, headY);
        trail.addColorStop(0, "#2ca5ff00");
        trail.addColorStop(0.42, "#168bff");
        trail.addColorStop(0.78, "#91edff");
        trail.addColorStop(1, "#ecfbff");

        context.globalAlpha = intensity;
        context.shadowColor = "#28b8ff";
        context.shadowBlur = 26 * pixelRatio;
        context.strokeStyle = trail;
        context.lineWidth = 11;
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(tailX, tailY);
        for (let segment = 8; segment >= 0; segment--) {
          const [x, y] = pointOnBranch(points, Math.max(0, progress - segment * 0.031));
          const jitter = segment === 0 ? 0 : Math.sin(segment * 3.9 + now * 0.016) * 5;
          context.lineTo(x + jitter, y - jitter);
        }
        context.globalAlpha = intensity * 0.46;
        context.stroke();
        context.globalAlpha = intensity;
        context.lineWidth = 5.5;
        context.stroke();

        const [forkX, forkY] = pointOnBranch(points, Math.max(0, progress - 0.045));
        const arc = Math.sin(now * 0.009 + delay) * 19;
        context.globalAlpha = intensity * 0.68;
        context.lineWidth = 2.7;
        context.beginPath();
        context.moveTo(forkX, forkY);
        context.lineTo(forkX + 9, forkY + arc);
        context.lineTo(forkX + 19, forkY + arc * 1.8 - 5);
        context.stroke();

        context.globalAlpha = intensity;
        context.fillStyle = "#ecfbff";
        context.beginPath();
        context.arc(headX, headY, 6.5, 0, Math.PI * 2);
        context.fill();
      }
      frame = requestAnimationFrame(draw);
    }

    function sync() {
      cancelAnimationFrame(frame);
      if (visible && !document.hidden && !reducedMotion.matches) {
        frame = requestAnimationFrame(draw);
      } else {
        clear();
      }
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const size = new ResizeObserver(resize);
    resize();
    size.observe(canvas);
    intersection.observe(canvas);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelAnimationFrame(frame);
      size.disconnect();
      intersection.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      clear();
    };
  }, []);

  return (
    <div className="neural-background" aria-hidden="true">
      <Image src="/neural-connections.webp" alt="" fill preload sizes="100vw" />
      <canvas ref={canvasRef} className="neural-signal" />
    </div>
  );
}
