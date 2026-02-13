import { useState, useEffect, useRef, useCallback } from "react";

const DRAIN_RATE = 5; // % per second while active
const RECHARGE_RATE = 8; // % per second while off

export function useNightVision() {
  const [active, setActive] = useState(false);
  const [battery, setBattery] = useState(100);
  const activeRef = useRef(active);
  const batteryRef = useRef(battery);
  activeRef.current = active;
  batteryRef.current = battery;

  const toggle = useCallback(() => {
    if (!activeRef.current && batteryRef.current <= 0) return;
    setActive(prev => !prev);
  }, []);

  // Key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyN" && !e.repeat) toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Battery drain/recharge loop
  useEffect(() => {
    let last = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setBattery(prev => {
        let next = prev;
        if (activeRef.current) {
          next = prev - DRAIN_RATE * dt;
          if (next <= 0) {
            next = 0;
            setActive(false);
          }
        } else {
          next = Math.min(100, prev + RECHARGE_RATE * dt);
        }
        batteryRef.current = next;
        return next;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { active, battery, toggle };
}
