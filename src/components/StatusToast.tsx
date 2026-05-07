"use client";

import { useEffect, useRef, useState } from "react";

export function StatusToast({
  message,
  onDismiss,
  duration = 3000
}: {
  message: string;
  onDismiss?: () => void;
  duration?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("");
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setDisplayMessage(message);
    setVisible(true);

    const fadeTimer = window.setTimeout(() => setVisible(false), duration);
    const clearTimer = window.setTimeout(() => {
      setDisplayMessage("");
      onDismissRef.current?.();
    }, duration + 250);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [duration, message]);

  if (!displayMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-5 z-[80] w-[calc(100%-32px)] max-w-[380px] -translate-x-1/2 rounded-2xl border border-paw-peach/70 bg-white/95 px-4 py-3 text-center text-xs font-black text-paw-cocoa shadow-[0_16px_40px_rgba(122,81,63,0.18)] backdrop-blur transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      {displayMessage}
    </div>
  );
}
