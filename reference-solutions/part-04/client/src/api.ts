import type {Credentials,ListQuery,Page,Room,SessionView,User} from './types';
export class ApiError extends Error{constructor(public readonly status:number,message:string){super(message);this.name='ApiError';}}
export async function getSession():Promise<SessionView>{return{user:null,csrfToken:''};}
export async function register(_credentials:Credentials,_csrf:string):Promise<User>{return{id:'',username:''};}
export async function login(_credentials:Credentials,_csrf:string):Promise<SessionView>{return{user:null,csrfToken:''};}
export async function logout(_csrf:string):Promise<void>{}
export async function fetchPage(query:ListQuery,_signal:AbortSignal):Promise<Page>{return{items:[],limit:query.limit,offset:query.offset,hasMore:false};}
export async function setFavorite(_userId:string,id:string,enabled:boolean,_csrf:string):Promise<{id:string;favorite:boolean}>{return{id,favorite:enabled};}
export async function getRoom(id:string,_signal:AbortSignal):Promise<Room>{return{id,title:'',notice:'',canEdit:false};}
export async function updateNotice(id:string,notice:string,_csrf:string):Promise<Room>{return{id,title:'',notice,canEdit:false};}
