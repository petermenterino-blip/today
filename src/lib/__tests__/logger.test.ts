import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../errorHandler', () => ({}));

import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('info logs to console.log', () => {
    logger.info('TestModule', 'Hello world');
    expect(console.log).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      'Hello world',
      ''
    );
  });

  it('warn logs to console.warn', () => {
    logger.warn('TestModule', 'Warning message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('error logs to console.error', () => {
    logger.error('TestModule', 'Error occurred');
    expect(console.error).toHaveBeenCalled();
  });

  it('includes context in log output', () => {
    logger.info('TestModule', 'With context', { userId: '123' });
    expect(console.log).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      'With context',
      expect.objectContaining({ userId: '123' })
    );
  });

  it('debug logs in DEV environment', () => {
    vi.stubEnv('MODE', 'development');
    logger.debug('TestModule', 'Debug info');
    expect(console.debug).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('stores error and critical logs in sessionStorage', () => {
    logger.error('TestModule', 'Storable error');
    const stored = JSON.parse(sessionStorage.getItem('mentorino_errors') || '[]');
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].level).toBe('error');
    expect(stored[0].module).toBe('TestModule');
  });

  it('does not store info logs in sessionStorage', () => {
    logger.info('TestModule', 'Info not stored');
    const stored = sessionStorage.getItem('mentorino_errors');
    expect(stored).toBeNull();
  });

  it('redacts sensitive keys from context', () => {
    logger.info('TestModule', 'Sensitive data', { password: 'secret123', api_key: 'abc', normal: 'visible' });
    expect(console.log).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      'Sensitive data',
      expect.objectContaining({
        password: '[REDACTED]',
        api_key: '[REDACTED]',
        normal: 'visible',
      })
    );
  });

  it('redacts JWT tokens from context values', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNqPnd9y1a7N8E1QpLQwLzT2XxOaFxv0Nq1z2b0';
    logger.info('TestModule', 'Has JWT', { raw_data: jwt });
    expect(console.log).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      'Has JWT',
      expect.objectContaining({
        raw_data: expect.stringContaining('[JWT REDACTED]'),
      })
    );
  });

  it('redacts Bearer tokens from context values', () => {
    logger.info('TestModule', 'Has Bearer', { header: 'Bearer someLongTokenValue123456789' });
    expect(console.log).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      'Has Bearer',
      expect.objectContaining({
        header: 'Bearer [REDACTED]',
      })
    );
  });

  it('truncates strings longer than 1000 characters', () => {
    const longString = 'a'.repeat(2000);
    logger.info('TestModule', 'Long string', { data: longString });
    expect(console.log).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      'Long string',
      expect.objectContaining({
        data: expect.stringMatching(/^a{1000}\.\.\. \[truncated\]$/),
      })
    );
  });

  it('limits stored errors to 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      logger.error('TestModule', `Error ${i}`);
    }
    const stored = JSON.parse(sessionStorage.getItem('mentorino_errors') || '[]');
    expect(stored.length).toBe(50);
    expect(stored[0].message).toBe('Error 10');
  });

  it('getRecentErrors returns stored errors', () => {
    logger.error('TestModule', 'Test error');
    const errors = logger.getRecentErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Test error');
  });

  it('clearRecentErrors removes stored errors', () => {
    logger.error('TestModule', 'To be cleared');
    logger.clearRecentErrors();
    const errors = logger.getRecentErrors();
    expect(errors.length).toBe(0);
  });

  it('critical logs with CRITICAL prefix', () => {
    logger.critical('TestModule', 'Critical issue');
    expect(console.error).toHaveBeenCalledWith(
      '[Mentorino][TestModule]',
      '[CRITICAL] Critical issue',
      ''
    );
  });
});
