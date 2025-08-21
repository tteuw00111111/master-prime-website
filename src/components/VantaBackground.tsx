"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function VantaBackground() {
  const vantaRef = useRef(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    if (vantaRef.current && !vantaEffect) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).THREE = THREE;

      import("vanta/dist/vanta.net.min.js").then((vantaModule) => {
        const NET = vantaModule.default;
        if (vantaRef.current) {
          setVantaEffect(
            NET({
              el: vantaRef.current,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.0,
              minWidth: 200.0,
              scale: 1.0,
              scaleMobile: 1.0,
              color: 0xffb700,
              backgroundColor: 0x0a0a0a,
              points: 12.0,
              maxDistance: 18.0,
              spacing: 16.0,
            })
          );
        }
      });
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [vantaEffect]);

  return (
    <div ref={vantaRef} className="absolute inset-0 -z-10 w-full h-full" />
  );
}
