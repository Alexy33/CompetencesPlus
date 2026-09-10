import { cva } from "class-variance-authority";

export const surface = cva("rounded-3xl", {
  variants: {
    tone: {
      raised: "bg-canvas shadow-raised-xl",
      elevated: "bg-canvas shadow-raised-2xl",
      outlined: "border border-brand-300 bg-panel",
      plain: "border border-brand/15 bg-white",
    },
    padding: { md: "p-6", lg: "p-7", responsive: "p-6 md:p-8" },
  },
  defaultVariants: { tone: "outlined", padding: "md" },
});
