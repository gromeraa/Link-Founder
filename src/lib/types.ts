export type ColorName =
  | 'blue' | 'indigo' | 'purple' | 'pink' | 'red'
  | 'orange' | 'yellow' | 'green' | 'teal' | 'gray';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;      // nome de um ícone em src/lib/icons.ts
  color: ColorName;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  collection: string; // id da coleção
  tags?: string[];
  addedAt: string;    // AAAA-MM-DD
  favorite?: boolean;
}

export interface Library {
  collections: Collection[];
  links: LinkItem[];
}

export type SortMode = 'recent' | 'oldest' | 'az' | 'domain';
export type ThemeMode = 'auto' | 'light' | 'dark';
