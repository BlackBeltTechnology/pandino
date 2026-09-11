import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleLogService } from '../console-log-service';
import { LogLevel } from '../interfaces';
import { silenceConsole } from '../../../test/console';

/**
 * OSGi R8 Log Service levels AUDIT (always recorded) and TRACE (least severe),
 * plus the trace()/audit() convenience methods.
 */
describe('LogService AUDIT and TRACE levels', () => {
  let service: ConsoleLogService;

  beforeEach(() => {
    service = new ConsoleLogService();
    silenceConsole(['log', 'error', 'debug', 'info']);
  });

  it('should order AUDIT above ERROR and TRACE below DEBUG', () => {
    expect(LogLevel.AUDIT).toBeLessThan(LogLevel.ERROR);
    expect(LogLevel.TRACE).toBeGreaterThan(LogLevel.DEBUG);
  });

  it('should always report AUDIT as loggable regardless of threshold', () => {
    service.setLogLevel(LogLevel.ERROR);
    expect(service.isLoggable(LogLevel.AUDIT)).toBe(true);
  });

  it('should record an AUDIT entry even when the threshold is ERROR', () => {
    service.setLogLevel(LogLevel.ERROR);
    const listener = { logged: vi.fn() };
    service.addLogListener(listener);

    service.audit('audit message');

    expect(listener.logged).toHaveBeenCalledTimes(1);
    expect(listener.logged.mock.calls[0][0].level).toBe(LogLevel.AUDIT);
  });

  it('should suppress TRACE when the threshold is INFO', () => {
    service.setLogLevel(LogLevel.INFO);
    const listener = { logged: vi.fn() };
    service.addLogListener(listener);

    service.trace('trace message');

    expect(listener.logged).not.toHaveBeenCalled();
  });

  it('should record TRACE when the threshold is raised to TRACE', () => {
    service.setLogLevel(LogLevel.TRACE);
    const listener = { logged: vi.fn() };
    service.addLogListener(listener);

    service.trace('trace message');

    expect(listener.logged).toHaveBeenCalledTimes(1);
    expect(listener.logged.mock.calls[0][0].level).toBe(LogLevel.TRACE);
  });

  it('should dispatch trace() at TRACE and audit() at AUDIT via log()', () => {
    service.setLogLevel(LogLevel.TRACE);
    const spy = vi.spyOn(service, 'log');

    service.trace('t');
    service.audit('a');

    expect(spy).toHaveBeenCalledWith(LogLevel.TRACE, 't', undefined, undefined);
    expect(spy).toHaveBeenCalledWith(LogLevel.AUDIT, 'a', undefined, undefined);
  });
});
