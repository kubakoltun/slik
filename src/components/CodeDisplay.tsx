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
  const [copied, setCopied] = useState(false);
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  // Timer color
  const timerColor =
    secondsLeft > 60
      ? "#30b566"
      : secondsLeft > 30
        ? "#e5960a"
        : "#df1b41";

  const digits = code.split("");

  if (isExpired) {
    return (
      <div
        className="flex flex-col items-center gap-6"
        style={{ animation: "fade-in-up 400ms ease both" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--error)" }}
          />
          <span
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: "var(--error)", fontFamily: "var(--font-code)" }}
          >
            Code expired
          </span>
        </div>

        <div className="flex gap-3">
          {digits.map((digit, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 72,
                borderRadius: 14,
                background: "rgba(223, 27, 65, 0.05)",
                border: "2px solid rgba(223, 27, 65, 0.15)",
                fontFamily: "var(--font-code)",
                fontSize: 32,
                fontWeight: 800,
                color: "var(--text-muted)",
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
    <div className="flex flex-col items-center gap-5">
      {/* Status */}
      <div className="flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: "var(--green)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-code)" }}
        >
          Tell this code to the cashier
        </span>
      </div>

      {/* Code - clickable to copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="group relative cursor-pointer"
        style={{
          background: "none",
          border: "none",
          padding: 0,
        }}
        title="Click to copy"
      >
        <div
          className="relative flex gap-3 px-7 py-6 rounded-2xl"
          style={{
            background: "var(--bg-card)",
            border: "2px solid var(--border)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
            transition: "border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 91, 255, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.06)";
          }}
        >
          {digits.map((digit, i) => (
            <div
              key={`${code}-${i}`}
              className="flex items-center justify-center"
              style={{
                width: 58,
                height: 76,
                borderRadius: 14,
                background: "#1a1a2e",
                border: "2px solid rgba(99, 91, 255, 0.2)",
                fontFamily: "var(--font-code)",
                fontSize: 36,
                fontWeight: 800,
                color: "#ffffff",
                animation: `digit-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60}ms both`,
              }}
            >
              {digit}
            </div>
          ))}
        </div>

        {/* Copy tooltip */}
        <div
          className="absolute -bottom-8 left-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{
            transform: "translateX(-50%)",
            background: copied ? "rgba(48, 181, 102, 0.08)" : "var(--bg-base)",
            border: copied ? "1px solid rgba(48, 181, 102, 0.2)" : "1px solid var(--border)",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: "var(--green)", fontFamily: "var(--font-code)" }}>
                Copied
              </span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="var(--primary)" strokeWidth="1.5"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="var(--primary)" strokeWidth="1.5"/>
              </svg>
              <span className="text-xs" style={{ color: "var(--primary)", fontFamily: "var(--font-code)" }}>
                Tap to copy
              </span>
            </>
          )}
        </div>
      </button>

      {/* Timer */}
      <div className="w-full max-w-xs flex flex-col gap-2 mt-4">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: timerColor,
              transition: "width 200ms linear, background 500ms ease",
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ fontFamily: "var(--font-code)", color: timerColor }}
          >
            {formatTime(secondsLeft)}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-code)" }}
          >
            remaining
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes digit-in {
          0% { opacity: 0; transform: scale(0.5) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
