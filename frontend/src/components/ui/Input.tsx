import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size = "md", ...props }, ref) => {
    const sizeClasses =
      size === "sm"
        ? "h-9 px-3 text-sm"
        : size === "lg"
        ? "h-12 px-4 text-base"
        : "h-10 px-3 text-sm";

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Base
          "block w-full rounded-md border border-gray-300 bg-white",
          "placeholder:text-gray-400",
          // Focus/disabled/invalid states
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-500",
          sizeClasses,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
