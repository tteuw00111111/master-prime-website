"use client";

import { useState, useEffect } from "react";

export const useIsMobile = (maxWidth: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < maxWidth);
    };

    checkDevice();

    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, [maxWidth]);

  return isMobile;
};
