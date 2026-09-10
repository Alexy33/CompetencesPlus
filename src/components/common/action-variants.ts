import { cva } from "class-variance-authority";

export const action = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      tone: {
        action: "bg-action text-white hover:bg-action-hover",
        brand: "bg-brand text-white hover:bg-brand-700",
        outline: "border border-brand/25 bg-white text-brand-700 hover:bg-brand-100",
        soft: "bg-brand-100 text-brand-700 hover:bg-brand-200",
        success: "bg-success text-success-fg hover:brightness-95",
        warning: "bg-warning text-warning-fg hover:brightness-95",
        danger: "bg-danger text-danger-fg hover:brightness-95",
        destructive: "bg-danger-fg text-white hover:brightness-110",
        ghost: "text-ink-muted hover:bg-white",
      },
      size: {
        icon: "size-9",
        xs: "h-9 px-3 text-xs",
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
      block: { true: "w-full", false: null },
    },
    defaultVariants: { tone: "action", size: "md", block: false },
  },
);
