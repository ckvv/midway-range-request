import { Controller, Get, Inject } from '@midwayjs/core';
import { access, stat } from 'node:fs/promises';
import { constants, createReadStream } from 'node:fs';
import { join, parse } from 'node:path';
import type { Context } from '@midwayjs/koa';

async function streamsResponses(filePath: string, ctx: Context) {
  await access(filePath, constants.R_OK);

  const type = filePath.split('.').at(-1).toLowerCase();

  switch (type) {
    case 'pdf':
      ctx.set('Content-Type', 'application/pdf');
      break;
    case 'mp4':
      ctx.set('Content-Type', 'video/mp4');
      break;
    default:
      ctx.set('Content-Type', 'application/octet-stream');
      ctx.set('Content-disposition', `attachment;filename="${encodeURIComponent(parse(filePath).base)}"`);
      break;
  }

  const fileSize = (await stat(filePath)).size;
  const range = ctx.header.range;
  if (range) {
    const ranges = range ? range.replace('bytes=', '').split('-') : ['0', `${fileSize - 1}`];
    const start = Number.parseInt(ranges[0]) || 0;
    const end = Number.parseInt(ranges[1]) || fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      ctx.set('Content-Range', `bytes */${fileSize}`);
      ctx.status = 416;
      return;
    }
    ctx.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    ctx.set('Content-Length', `${end - start + 1}`);
    ctx.set('Accept-Ranges', 'bytes');
    ctx.status = 206;
    return createReadStream(filePath, { start, end, autoClose: true });
  } else {
    ctx.set('Content-Length', `${fileSize}`);
    return createReadStream(filePath);
  }
}

@Controller('/')
export class HomeController {
  @Inject()
  ctx: Context;

  @Get('/')
  async home() {
    return streamsResponses( join(this.ctx.app.getAppDir(), 'a462ec56a0101212058ad70e4a85704c.mp4'), this.ctx);
  }
}
