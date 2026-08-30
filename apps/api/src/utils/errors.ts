export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fields: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
