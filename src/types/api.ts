export interface Collection<T> {
  items: T[];
}

/** Le questionnaire est servi avec la version du fichier en vigueur. */
export interface VersionedCollection<T> extends Collection<T> {
  version: number;
  versions: number[];
}
