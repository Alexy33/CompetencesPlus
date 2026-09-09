import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import type { buttonVariants } from "./button-variants";

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export type CardProps = React.ComponentProps<"div"> & { size?: "default" | "sm" };
