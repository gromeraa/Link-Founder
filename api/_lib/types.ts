/** Tipos compartilhados entre o site (src/) e a API (api/). */
export type ColorName =
  | 'blue' | 'indigo' | 'purple' | 'pink' | 'red'
  | 'orange' | 'yellow' | 'green' | 'teal' | 'gray';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: ColorName;
  order?: number;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  collection: string;
  tags?: string[];
  addedAt: string; // AAAA-MM-DD
  addedBy?: string;
  favorite?: boolean;
}

export interface Library {
  collections: Collection[];
  links: LinkItem[];
}

export interface LibraryResponse extends Library {
  version: number;
}
