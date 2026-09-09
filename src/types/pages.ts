import type { SearchParams } from "@/components/catalogue/types";
import type { ReactNode } from "react";

export type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export type LayoutProps = Readonly<{ children: ReactNode }>;

export type CataloguePageProps = { searchParams: Promise<SearchParams> };

export type ProfilePageProps = { params: Promise<{ id: string }> };
