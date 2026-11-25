import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-deep)] text-white shadow-[0_10px_24px_-12px_rgba(13,74,60,0.7)] hover:bg-[var(--brand)] hover:shadow-[0_14px_28px_-12px_rgba(20,104,85,0.65)]",
        secondary:
          "bg-[var(--mist)] text-[var(--ink)] hover:bg-[#e3ebe8]",
        outline:
          "border border-[var(--line-strong)] bg-white/70 text-[var(--ink)] hover:border-[var(--brand)]/30 hover:bg-white",
        danger: "bg-[var(--danger)] text-white hover:brightness-110",
        ghost: "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]",
        brass:
          "bg-[var(--brass)] text-[var(--ink)] shadow-[0_10px_24px_-14px_rgba(176,141,87,0.8)] hover:brightness-105",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 px-7 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";
