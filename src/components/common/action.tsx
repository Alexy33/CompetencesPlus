import { cn } from "@/lib/utils";
import Link from "next/link";
import { action } from "./action-variants";
import type { ActionLinkProps, ActionProps } from "./types";

export function Action({ tone, size, block, className, type = "button", ...props }: ActionProps) {
  return <button type={type} className={cn(action({ tone, size, block }), className)} {...props} />;
}

export function ActionLink({ tone, size, block, className, ...props }: ActionLinkProps) {
  return <Link className={cn(action({ tone, size, block }), className)} {...props} />;
}
