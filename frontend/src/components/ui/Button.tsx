import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",

          // Variants
          variant === "default" &&
            "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
          variant === "outline" &&
            "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
          variant === "ghost" &&
            "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",

          // Sizes
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 py-2",
          size === "lg" && "h-12 px-6 text-lg",

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
