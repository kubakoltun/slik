"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface CodeDisplayProps {
  code: string;
  expiresAt: number;
  onExpired: () => void;
}

export function CodeDisplay({ code, expiresAt, onExpired }: CodeDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  );
  const [isExpired, setIsExpired] = useState(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
        onExpiredRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const totalDuration = 120;
  const progress = Math.max(0, secondsLeft / totalDuration);

  const formatTime = useCallback((s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }, []);

  // Timer color: green -> yellow -> red
  const timerColor =
    secondsLeft > 60
      ? "var(--accent)"
      : secondsLeft > 30
        ? "var(--warning)"
        : "var(--error)";

  const timerColorClass =
    secondsLeft > 60
      ? "text-[var(--accent)]"
      : secondsLeft > 30
        ? "text-[var(--warning)]"
        : "text-[var(--error)]";

  const dotStatusClass =
    secondsLeft > 60
      ? "active"
      : secondsLeft > 30
        ? "warning"
        : secondsLeft > 0
          ? "expired"
          : "expired";

  const digits = code.split("");

  if (isExpired) {
    return (
      <div
        className="flex flex-col items-center gap-6"
        style={{ animation: "fade-in-up 400ms ease both" }}
      >
        <div className="flex items-center gap-3">
          <span className="status-dot expired" />
          <span
            className="text-sm font-medium tracking-wide uppercase"
            style={{ color: "var(--error)" }}
          >
            Code expired
          </span>
        </div>

        <div className="flex gap-3">
          {digits.map((digit, i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 56,
                height: 72,
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                fontFamily: "var(--font-code)",
                fontSize: 32,
                fontWeight: 700,
                color: "var(--text-dim)",
                opacity: 0.4,
              }}
            >
              {digit}
            </div>
          ))}
        </div>

        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Generate a new code to continue
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <span className={`status-dot ${dotStatusClass}`} />
        <span
          className="text-sm font-medium tracking-wide uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Waiting for merchant
        </span>
      </div>

      {/* Tell the code label */}
      <p
        className="text-sm"
        style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
      >
        Tell this code to the cashier
      </p>

      {/* Digit boxes */}
      <div
        className="flex gap-3 p-6 rounded-2xl"
        style={{
          background: "rgba(0, 229, 160, 0.03)",
          border: "1px solid rgba(0, 229, 160, 0.08)",
          animation: "code-glow 3s ease-in-out infinite",
        }}
      >
        {digits.map((digit, i) => (
          <div
            key={`${code}-${i}`}
            className="digit-box active flex items-center justify-center rounded-xl"
            style={{
              width: 56,
              height: 72,
              background: "var(--bg-card)",
              border: "1px solid rgba(0, 229, 160, 0.12)",
              fontFamily: "var(--font-code)",
              fontSize: 32,
              fontWeight: 700,
              color: "var(--accent)",
              animationDelay: `${i * 60}ms`,
              textShadow: "0 0 20px rgba(0, 229, 160, 0.3)",
            }}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: timerColor,
              transition: "width 200ms linear, background 500ms ease",
              boxShadow: `0 0 8px ${timerColor}`,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-mono font-semibold ${timerColorClass}`}
            style={{ fontFamily: "var(--font-code)" }}
          >
            {formatTime(secondsLeft)}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-dim)" }}
          >
            remaining
          </span>
        </div>
      </div>
    </div>
  );
}
