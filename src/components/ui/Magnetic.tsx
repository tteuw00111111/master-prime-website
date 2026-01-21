"use client";
import React, { useRef, useMemo, useCallback, memo } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export const Magnetic = memo(({
  children,
  strength = 0.5,
}: {
  children: React.ReactNode;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Memoize spring config
  const springConfig = useMemo(
    () => ({ damping: 15, stiffness: 150, mass: 0.1 }),
    []
  );

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Memoize handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    x.set(distanceX * strength);
    y.set(distanceY * strength);
  }, [strength, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  // Memoize style object
  const motionStyle = useMemo(() => ({ x: springX, y: springY }), [springX, springY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={motionStyle}
    >
      {children}
    </motion.div>
  );
});

Magnetic.displayName = 'Magnetic';
