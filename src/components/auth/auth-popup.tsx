"use client";

import { BriefcaseBusiness, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "framer-motion";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthPopup({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <m.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            layout: { duration: 0.4, ease: "easeInOut" },
            duration: 0.4,
            ease: "easeOut",
          }}
          className="w-full"
        >
          <Card className="w-full gap-0 rounded-3xl border-0 bg-canvas py-0 shadow-raised-3xl ring-1 ring-brand/10">
            <CardHeader className="flex flex-row items-center justify-between border-b border-brand/12 px-8 py-6 sm:px-12">
              <div className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ink">
                <span className="rounded-lg bg-brand p-2.5 text-white shadow-sm">
                  <BriefcaseBusiness aria-hidden="true" className="size-5" />
                </span>
                ProfilsActifs
              </div>
              <Link
                href="/"
                aria-label="Retourner à l'accueil"
                title="Retourner à l'accueil"
                className="flex size-9 items-center justify-center rounded-xl bg-canvas text-brand-700 shadow-raised-sm transition-all hover:text-brand hover:shadow-pressed-xs active:scale-95"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </Link>
            </CardHeader>

            <CardContent className="relative px-8 py-10 sm:px-12 sm:py-12">
              <AnimatePresence mode="popLayout" initial={false}>
                <m.div
                  key={pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {children}
                </m.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
