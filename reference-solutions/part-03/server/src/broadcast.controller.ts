import {BadRequestException,Body,Controller,Delete,Get,Headers,Param,Put,Query} from '@nestjs/common';
import {IdDto,ListDto} from './broadcast.dto.js';
import {BroadcastsService} from './broadcast.service.js';
function assertEmpty(value:unknown){if(value!==undefined&&(typeof value!=='object'||value===null||Array.isArray(value)||Object.keys(value).length))throw new BadRequestException('No input fields allowed');}
function assertWriteInput(query:unknown,body:unknown,length:string|undefined,transfer:string|undefined){
  assertEmpty(query);assertEmpty(body);
  if(body===undefined&&((length!==undefined&&length!=='0')||transfer))throw new BadRequestException('Unsupported body');
}
@Controller()
export class BroadcastsController {
  constructor(private readonly broadcasts:BroadcastsService){}
  @Get('broadcasts') list(@Query() query:ListDto){return this.broadcasts.list(query);}
  @Get('broadcasts/:id') detail(@Param() params:IdDto,@Query() query:unknown){assertEmpty(query);return this.broadcasts.get(params.id);}
  @Put('favorites/:id') put(@Param() params:IdDto,@Query() query:unknown,@Body() body:unknown,@Headers('content-length') length:string|undefined,@Headers('transfer-encoding') transfer:string|undefined){assertWriteInput(query,body,length,transfer);return this.broadcasts.setFavorite(params.id,true);}
  @Delete('favorites/:id') remove(@Param() params:IdDto,@Query() query:unknown,@Body() body:unknown,@Headers('content-length') length:string|undefined,@Headers('transfer-encoding') transfer:string|undefined){assertWriteInput(query,body,length,transfer);return this.broadcasts.setFavorite(params.id,false);}
}
