"use client";
import { cn } from "@/lib/utils";
import React from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const count = number || 20;
  const meteors = new Array(count).fill(true);
  return (
    <div className="pointer-events-none">
      {/* Local keyframes to avoid global CSS changes */}
      <style jsx global>{`
        @keyframes meteor {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-500px);
            opacity: 0;
          }
        }
      `}</style>
      {meteors.map((_, idx) => {
        const position = idx * (800 / count) - 400;
        const durationSec = Math.floor(Math.random() * (10 - 5) + 5);
        const delaySec = Math.random() * 5;
        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
              "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
              className
            )}
            style={
              {
                top: "-40px",
                left: position + "px",
                animationName: "meteor",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${delaySec}s`,
                animationDuration: `${durationSec}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};
