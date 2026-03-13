export class HttpError extends Error {
  /** @param {number} status */
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function toHttpError(err) {
  if (err instanceof HttpError) return err;
  return new HttpError(500, 'Internal server error');
}
