import { cva } from "class-variance-authority";

export const chip = cva("inline-flex items-center gap-1 rounded-full font-semibold", {
  variants: {
    tone: {
      brand: "bg-brand-200 text-brand-800",
      success: "bg-success text-success-fg",
      warning: "bg-warning text-warning-fg",
      danger: "bg-danger text-danger-fg",
      info: "bg-info text-info-fg",
      teal: "bg-teal text-teal-fg",
    },
    size: {
      xs: "px-2 py-1 text-[10px]",
      sm: "px-2.5 py-1 text-[11px]",
      md: "px-3 py-1.5 text-xs",
    },
  },
  defaultVariants: { tone: "brand", size: "sm" },
});
