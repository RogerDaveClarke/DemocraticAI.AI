const {
  sanitizeQueryInput,
  isQueryInputValid,
} = require('../../dist/utils/inputSecurity.js');

describe('inputSecurity', () => {
  test('sanitizeQueryInput strips script tags and javascript URLs', () => {
    const payload = '  <script>alert(1)</script> javascript:alert(2) clean text  ';
    expect(sanitizeQueryInput(payload)).toBe('alert(2) clean text');
  });

  test('sanitizeQueryInput strips inline event handlers', () => {
    const payload = 'onload=alert(1) parliamentary update';
    expect(sanitizeQueryInput(payload)).toBe('alert(1) parliamentary update');
  });

  test('isQueryInputValid rejects unsafe or undersized payloads', () => {
    expect(isQueryInputValid('<script>x</script>')).toBe(false);
    expect(isQueryInputValid('ab')).toBe(false);
    expect(isQueryInputValid('')).toBe(false);
    expect(isQueryInputValid(null)).toBe(false);
  });

  test('isQueryInputValid accepts normal parliamentary queries', () => {
    expect(isQueryInputValid('What bills were debated this week?')).toBe(true);
  });
});
