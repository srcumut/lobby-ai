"use client";

import { useEffect, useState } from "react";

const frames = ["🍒", "⚡", "💎", "🍀", "⭐"];

export function LobbySlotSpinner() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 110);
    return () => window.clearInterval(interval);
  }, []);
  return <span aria-label="Slot dönüyor">🎰 [ {frames[tick % frames.length]} | {frames[(tick + 2) % frames.length]} | {frames[(tick + 4) % frames.length]} ] Dönüyor...</span>;
}
