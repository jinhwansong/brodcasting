import {IsString,Length,Matches,MaxLength} from 'class-validator';
export class CredentialsDto{
 @IsString() @Matches(/^[a-z][a-z0-9_]{2,23}(?![\s\S])/) username!:string;
 @IsString() @Length(15,128) password!:string;
}
export class NoticeDto{
 @IsString() @MaxLength(500) notice!:string;
}
