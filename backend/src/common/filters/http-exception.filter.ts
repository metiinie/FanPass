import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Log the error for debugging
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Handle Prisma Specific Errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // Unique constraint
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          message = `Duplicate entry: A record with this ${target.join(', ')} already exists.`;
          break;
        case 'P2025': // Not found
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) || 'Record not found.';
          break;
        case 'P2003': // Foreign key failure
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed: Related record not found.';
          break;
        case 'P3005': // The DB schema is not empty (Migration error)
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database sync error: The schema is not empty but no migrations found. Use db push instead.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database Error (${exception.code})`;
          break;
      }
    }

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
