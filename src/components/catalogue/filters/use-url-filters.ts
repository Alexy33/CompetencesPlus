"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { UrlFilters } from "./types";

export function useUrlFilters(): UrlFilters {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const latestParams = useRef(searchParams.toString());

  const query = searchParams.get("q") ?? "";
  const sector = searchParams.get("sector") ?? "";
  const city = searchParams.get("city") ?? "";
  const certifiedOnly = searchParams.get("certified") === "true";
  const availability = searchParams.get("availability") ?? "";
  const skills = searchParams.getAll("skills");

  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
    latestParams.current = searchParams.toString();
  }, [query, searchParams]);

  function navigate(target: string) {
    startTransition(() => router.push(target, { scroll: false }));
  }

  function apply(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(latestParams.current);
    mutate(params);
    params.delete("page");
    latestParams.current = params.toString();
    navigate(latestParams.current ? `${pathname}?${latestParams.current}` : pathname);
  }

  return {
    query,
    sector,
    city,
    certifiedOnly,
    availability,
    skills,
    hasAny: Boolean(query || sector || city || certifiedOnly || availability || skills.length),
    pending,
    draftQuery,
    setDraftQuery,
    setSingle: (key, value) =>
      apply((params) => (value ? params.set(key, value) : params.delete(key))),
    toggleMulti: (key, value) =>
      apply((params) => {
        const current = params.getAll(key);
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];

        params.delete(key);
        for (const item of next) params.append(key, item);
      }),
    reset: () => {
      latestParams.current = "";
      setDraftQuery("");
      navigate(pathname);
    },
  };
}
