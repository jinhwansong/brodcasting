export type User={id:string;username:string};
export type Credentials={username:string;password:string};
export type SessionView={user:User|null;csrfToken:string};
