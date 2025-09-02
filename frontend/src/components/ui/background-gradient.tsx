import * as React from "react";
import { cn } from "@/lib/utils";

type BackgroundGradientProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export function BackgroundGradient({
  children,
  className,
  containerClassName,
}: BackgroundGradientProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-[1px]",
        "bg-transparent",
        containerClassName
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 via-indigo-500/30 to-purple-500/30" />
        <div className="absolute -inset-24 rounded-[inherit] bg-[radial-gradient(600px_300px_at_20%_-10%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(600px_300px_at_120%_120%,rgba(59,130,246,0.22),transparent_60%)] blur-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
      </div>
      <div
        className={cn(
          "relative rounded-2xl bg-white text-gray-900 dark:bg-zinc-900",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default BackgroundGradient;
