export class PasswordService {
  // A: 검증된 해싱/검증을 구현하세요. 현재는 사용할 수 없는 골격입니다.
  async hash(_value:string):Promise<string>{return '';}
  async verify(_encoded:string,_value:string):Promise<boolean>{return false;}
}
