const SCRIPT_TAG_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const JAVASCRIPT_URL_PATTERN = /javascript:/gi;
const INLINE_EVENT_HANDLER_PATTERN = /on\w+\s*=/gi;

export function sanitizeQueryInput(input: string): string {
  return input
    .replace(SCRIPT_TAG_PATTERN, '')
    .replace(JAVASCRIPT_URL_PATTERN, '')
    .replace(INLINE_EVENT_HANDLER_PATTERN, '')
    .trim();
}

export function isQueryInputValid(input: unknown): input is string {
  if (typeof input !== 'string') {
    return false;
  }

  const sanitized = sanitizeQueryInput(input);
  return sanitized.length >= 3 && sanitized.length <= 2000;
}
