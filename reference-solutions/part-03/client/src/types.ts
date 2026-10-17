export type SortOrder='viewers-desc'|'title-asc';
export type Broadcast={id:string;title:string;hostName:string;viewerCount:number;description:string;favorite:boolean};
export type ListQuery={search:string;sort:SortOrder;limit:number;offset:number;favoritesOnly:boolean};
export type Page={items:Broadcast[];limit:number;offset:number;hasMore:boolean};
export type RemoteState<T>={status:'idle'|'loading'}|{status:'success';data:T}|{status:'error';error:Error};
