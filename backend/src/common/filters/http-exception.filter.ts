import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Log the error for debugging
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody = {
      success: false,
      message: typeof message === 'string' ? message : (message as any).message || 'Error',
      data: null,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
    };

    response.status(status).json(responseBody);
  }
}
