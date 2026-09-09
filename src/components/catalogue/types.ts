import type { City, Sector, Skill, UserRole } from "@/lib/vocabulary";
import type { CatalogQuery } from "@/server/contracts/profile";
import type { FullProfile, ProfileCard as ProfileCardData } from "@/server/services/profiles";
import type { VideoView } from "@/server/video/presentation";
import type { ReactNode } from "react";

export type CatalogueFiltersProps = {
  sectors: readonly Sector[];
  cities: readonly City[];
  skills: readonly Skill[];
};

export interface CataloguePaginationProps {
  page: number;
  totalPages: number;

  params: URLSearchParams;
}

export type SearchParams = Record<string, string | string[] | undefined>;

export type CatalogFilters = ReturnType<typeof CatalogQuery.parse>;

export type CertificationChipProps = { certified: boolean; score: number | null };

export type FavoriteButtonProps = {
  profile: ProfileCardData;
  initialFavorite: boolean;
};

export type ProfileActionsProps = {
  profileId: string;
  role: UserRole | null;
};

export type ProfileCardProps = {
  profile: ProfileCardData;
  canFavorite?: boolean;
  initialFavorite?: boolean;
};

export type VideoFrameProps = { children: ReactNode };

export type VideoPlaceholderProps = {
  icon: ReactNode;
  children: ReactNode;
};

export type PlaceholderTextProps = { children: ReactNode };

export type ProfileVideoProps = { video: VideoView; name: string };

export type RecruiterActionsProps = { profileId: string };

export type ProfileDetailsProps = { profile: FullProfile };

export type ProfileCertificationProps = {
  profile: Pick<FullProfile, "certified" | "score">;
  threshold: number;
};
