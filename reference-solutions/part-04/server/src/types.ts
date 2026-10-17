export type SortOrder='viewers-desc'|'title-asc';
export type User={id:string;username:string};
export type Account=User&{passwordHash:string};
export type Broadcast={id:string;title:string;hostName:string;viewerCount:number;description:string;favorite:boolean};
export type ListQuery={search:string;sort:SortOrder;limit:number;offset:number;favoritesOnly:boolean};
export type Page={items:Broadcast[];limit:number;offset:number;hasMore:boolean};
export type Room={id:string;title:string;notice:string;canEdit:boolean};
