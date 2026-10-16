export type Broadcast = { id: string; title: string; hostName: string; viewerCount: number };
export type SortOrder = 'viewers-desc' | 'title-asc';
export type Query = { search: string; sort: SortOrder; favoritesOnly: boolean };
export type LoadMode = 'success' | 'empty' | 'error';
