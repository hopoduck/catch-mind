import { Controller, Get, Header, HttpStatus, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', register.contentType)
  async getMetrics(@Req() req: Request, @Res() res: Response) {
    const ip = req.headers['x-real-ip'] ?? req.ip;
    if (!['::1', '127.0.0.1', 'localhost'].includes(ip.toString())) {
      return res.status(HttpStatus.UNAUTHORIZED).end();
    }

    res.end(await register.metrics());
  }
}
