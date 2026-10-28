import type { ErrorRequestHandler, RequestHandler } from 'express';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found.'));
};

/** Maps Postgres errors raised by the SQL layer to HTTP responses. */
function fromPostgres(error: unknown): ApiError | null {
  const code = (error as { code?: string } | null)?.code;

  switch (code) {
    case '42501':
      return new ApiError(403, 'FORBIDDEN', 'Anda tiada kebenaran untuk operasi ini.');
    case '23505':
      return new ApiError(409, 'CONFLICT', 'Rekod dengan kunci yang sama sudah wujud.');
    case '23514':
    case '22023':
      return new ApiError(400, 'BAD_REQUEST', 'Nilai tidak sah.');
    case 'P0002':
      return new ApiError(404, 'NOT_FOUND', 'Rekod tidak dijumpai.');
    default:
      return null;
  }
}

// Express only treats an error handler as such when it declares four arguments.
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  void next;
  const mapped = error instanceof ApiError ? error : fromPostgres(error);
  if (mapped) {
    res.status(mapped.status).json({ error: { code: mapped.code, message: mapped.message } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Ralat pelayan tidak dijangka.' } });
};
