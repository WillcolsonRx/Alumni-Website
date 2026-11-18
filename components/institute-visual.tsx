"use client";

import Image from "next/image";
import type { PointerEvent } from "react";

export function InstituteVisual() {
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--pitch", `${-y * 14}deg`);
    event.currentTarget.style.setProperty("--yaw", `${x * 18}deg`);
  }

  function reset(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.removeProperty("--pitch");
    event.currentTarget.style.removeProperty("--yaw");
  }

  return (
    <div className="institute-visual" onPointerMove={tilt} onPointerLeave={reset}>
      <div className="visual-plane">
        <div className="orbital" aria-hidden="true">
          <div className="orbital-model">
            <span className="orbit orbit-one"><span /></span>
            <span className="orbit orbit-two"><span /></span>
            <span className="orbit orbit-three"><span /></span>
            <span className="nucleus" />
          </div>
        </div>
        <figure className="campus-photo">
          <Image src="/institute/niper-entrance.jpg" alt="Entrance gate and institute sign at NIPER-Raebareli" width={275} height={183} priority />
          <figcaption>NIPER-Raebareli entrance</figcaption>
        </figure>
      </div>
    </div>
  );
}
