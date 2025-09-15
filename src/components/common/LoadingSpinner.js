// src/components/ui/LoadingSpinner.js
import React from "react";

/**
 * Props:
 * - message: string (optional) — text under the spinner
 * - className: string (optional) — wrapper styles
 * - size: "sm" | "md" | "lg" (default "md")
 * - variant: "page" | "inline" (default "page")
 */
export default function Loader({ message = "Loading…", className = "", size = "md", variant = "page" }) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-10 w-10 border-2",
    lg: "h-14 w-14 border-2",
  };

  const spinner = (
    <span
      aria-hidden="true"
      className={`animate-spin rounded-full ${sizes[size]} border-gray-300 border-t-blue-600`}
    />
  );

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {spinner}
        {message && <span className="text-sm text-gray-700">{message}</span>}
      </span>
    );
  }

  // page
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full flex flex-col items-center justify-center text-center py-16 ${className}`}
    >
      {spinner}
      {message && <p className="mt-3 text-gray-700">{message}</p>}
    </div>
  );
}
