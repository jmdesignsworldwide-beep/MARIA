"use client";

import { cn } from "@/lib/utils";

/** Interruptor accesible (on/off) controlado. */
export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-50",
        checked ? "bg-accent" : "bg-line",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
