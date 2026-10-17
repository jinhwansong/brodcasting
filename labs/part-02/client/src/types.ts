export type Broadcast = { id: string; title: string; hostName: string; viewerCount: number; description: string };
export type SortOrder = 'viewers-desc' | 'title-asc';
export type Query = { search: string; sort: SortOrder; favoritesOnly: boolean };
export type Scenario = 'normal' | 'slow' | 'error';
export type RemoteState<T> = { status: 'idle' | 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };
