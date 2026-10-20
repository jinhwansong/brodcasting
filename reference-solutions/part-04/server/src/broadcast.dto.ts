import {Transform} from 'class-transformer';
import {IsBoolean,IsIn,IsInt,IsString,IsUUID,Matches,Max,MaxLength,Min} from 'class-validator';
const integer=({value}:{value:unknown})=>typeof value==='string'&&/^(0|[1-9][0-9]*)$/.test(value)?Number(value):value;
export class ListDto{
 @IsString() @MaxLength(80) search='';
 @IsIn(['viewers-desc','title-asc']) sort:'viewers-desc'|'title-asc'='viewers-desc';
 @Transform(integer) @IsInt() @Min(1) @Max(50) limit=2;
 @Transform(integer) @IsInt() @Min(0) @Max(100000) offset=0;
 @Transform(({value})=>value==='true'?true:value==='false'?false:value) @IsBoolean() favoritesOnly=false;
}
export class IdDto{@IsString() @Matches(/^[a-z0-9-]{1,32}(?![\s\S])/) id!:string;}
export class UserDto{@IsUUID('4') userId!:string;}
export class FavoriteDto extends UserDto{@IsString() @Matches(/^[a-z0-9-]{1,32}(?![\s\S])/) id!:string;}
