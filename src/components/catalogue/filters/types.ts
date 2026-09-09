import type { ReactNode } from "react";

export type FilterGroupProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
};

export type SearchFilterProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export type SelectFilterProps = {
  id: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
};

export type ToggleFilterProps = {
  active: boolean;
  offLabel: string;
  onLabel: string;
  onChange: (active: boolean) => void;
};

export type ChipFilterProps = {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
};

export interface UrlFilters {
  query: string;
  sector: string;
  city: string;
  certifiedOnly: boolean;
  availability: string;
  skills: string[];
  hasAny: boolean;
  pending: boolean;
  draftQuery: string;
  setDraftQuery: (value: string) => void;
  setSingle: (key: string, value: string) => void;
  toggleMulti: (key: string, value: string) => void;
  reset: () => void;
}
