import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bundle } from '../../../framework/interfaces';
import { SERVICE_EVENT_TYPES } from '../../../types/constants';
import { ServiceTracker } from '../../service-tracker';
import {
  type MockService,
  createTrackerContext,
  makeServiceEvent,
  makeServiceRef,
} from '../../service-tracker/__tests__/support/tracker-mocks';
import { BundleAwareLogService } from '../bundle-aware-log-service';
import { ConsoleLogService } from '../console-log-service';
import { LogLevel, type LogEntry, type LogListener } from '../interfaces';
import { silenceConsole } from '../../../test/console';

/**
 * Group 9 coverage: OSGi Log Service threshold matrix + listener isolation, and
 * ServiceTracker ranking / lifecycle / customizer edge cases. Scenarios here are
 * intentionally distinct from log-audit-trace.test.ts, log-level.test.ts,
 * bundle-aware-log-service.test.ts, service-tracker.test.ts, and
 * service-tracker-extended.test.ts.
 */
describe('Log Service — threshold matrix across all ported levels', () => {
  let service: ConsoleLogService;

  beforeEach(() => {
    service = new ConsoleLogService();
    silenceConsole(['log', 'error', 'warn', 'info', 'debug']);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // For each configured threshold, the exact set of levels that must be recorded.
  // AUDIT is always recorded; every other level is gated by `level <= currentLevel`.
  const matrix: Array<{ threshold: LogLevel; recorded: LogLevel[] }> = [
    { threshold: LogLevel.AUDIT, recorded: [LogLevel.AUDIT] },
    { threshold: LogLevel.ERROR, recorded: [LogLevel.AUDIT, LogLevel.ERROR] },
    { threshold: LogLevel.WARN, recorded: [LogLevel.AUDIT, LogLevel.ERROR, LogLevel.WARN] },
    { threshold: LogLevel.INFO, recorded: [LogLevel.AUDIT, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO] },
    {
      threshold: LogLevel.DEBUG,
      recorded: [LogLevel.AUDIT, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG],
    },
    {
      threshold: LogLevel.TRACE,
      recorded: [LogLevel.AUDIT, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE],
    },
  ];

  const allLevels = [LogLevel.AUDIT, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];

  for (const { threshold, recorded } of matrix) {
    it(`records exactly ${recorded.map((l) => LogLevel[l]).join('/')} at threshold ${LogLevel[threshold]}`, () => {
      service.setLogLevel(threshold);
      const seen: LogLevel[] = [];
      const listener: LogListener = { logged: (entry: LogEntry) => seen.push(entry.level) };
      service.addLogListener(listener);

      for (const level of allLevels) {
        service.log(level, `msg-${LogLevel[level]}`);
      }

      expect(seen.sort((a, b) => a - b)).toEqual([...recorded].sort((a, b) => a - b));
    });

    it(`isLoggable agrees with the recorded set at threshold ${LogLevel[threshold]}`, () => {
      service.setLogLevel(threshold);
      for (const level of allLevels) {
        expect(service.isLoggable(level)).toBe(recorded.includes(level));
      }
    });
  }

  it('always records AUDIT even at the most restrictive threshold (AUDIT)', () => {
    service.setLogLevel(LogLevel.AUDIT);
    const listener = { logged: vi.fn() };
    service.addLogListener(listener);

    service.audit('a');
    service.error('e'); // ERROR(1) <= AUDIT(0) is false → suppressed

    expect(listener.logged).toHaveBeenCalledTimes(1);
    expect(listener.logged.mock.calls[0][0].level).toBe(LogLevel.AUDIT);
  });
});

describe('Log Service — LogListener isolation', () => {
  let service: ConsoleLogService;

  beforeEach(() => {
    service = new ConsoleLogService();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('continues notifying remaining listeners when one throws', () => {
    const order: string[] = [];
    const first: LogListener = {
      logged: () => {
        order.push('first');
      },
    };
    const throwing: LogListener = {
      logged: () => {
        order.push('throwing');
        throw new Error('listener boom');
      },
    };
    const last: LogListener = {
      logged: () => {
        order.push('last');
      },
    };

    service.addLogListener(first);
    service.addLogListener(throwing);
    service.addLogListener(last);

    expect(() => service.info('hello')).not.toThrow();
    expect(order).toEqual(['first', 'throwing', 'last']);
    // The thrown error is swallowed and reported via console.error, not rethrown.
    expect(console.error).toHaveBeenCalledWith('Error in log listener:', expect.any(Error));
  });
});

describe('Log Service — per-bundle logger state isolation', () => {
  const makeBundle = (id: number, symbolicName: string, version: string, location: string): Bundle =>
    ({
      getBundleId: vi.fn().mockReturnValue(id),
      getSymbolicName: vi.fn().mockReturnValue(symbolicName),
      getVersion: vi.fn().mockReturnValue(version),
      getLocation: vi.fn().mockReturnValue(location),
    }) as unknown as Bundle;

  let underlying: ConsoleLogService;
  let loggerA: BundleAwareLogService;
  let loggerB: BundleAwareLogService;

  beforeEach(() => {
    underlying = new ConsoleLogService();
    loggerA = new BundleAwareLogService(underlying, makeBundle(1, 'bundle.a', '1.0.0', '/a'));
    loggerB = new BundleAwareLogService(underlying, makeBundle(2, 'bundle.b', '2.0.0', '/b'));
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stamps distinct bundle metadata per wrapping logger', () => {
    const entries: LogEntry[] = [];
    underlying.addLogListener({ logged: (e) => entries.push(e) });

    loggerA.info('from a');
    loggerB.info('from b');

    expect(entries).toHaveLength(2);
    expect(entries[0].bundle).toBe('bundle.a');
    expect(entries[1].bundle).toBe('bundle.b');
    expect(loggerA.getBundle().getBundleId()).toBe(1);
    expect(loggerB.getBundle().getBundleId()).toBe(2);
  });

  it('shares level state across per-bundle loggers wrapping the same service', () => {
    // DIVERGENCE: OSGi R8 exposes per-bundle Loggers via LoggerFactory whose
    // effective level can be configured independently per bundle (via
    // LoggerAdmin / LoggerContext). Pandino's BundleAwareLogService delegates
    // setLogLevel/getLogLevel straight to the single wrapped service, so the
    // threshold is global — changing it through one bundle's logger changes it
    // for every bundle sharing that underlying service.
    loggerA.setLogLevel(LogLevel.ERROR);

    expect(loggerB.getLogLevel()).toBe(LogLevel.ERROR);
    expect(underlying.getLogLevel()).toBe(LogLevel.ERROR);

    const entries: LogEntry[] = [];
    underlying.addLogListener({ logged: (e) => entries.push(e) });

    loggerB.info('suppressed for b too'); // INFO > ERROR threshold → suppressed
    loggerB.error('recorded for b');

    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe(LogLevel.ERROR);
    expect(entries[0].bundle).toBe('bundle.b');
  });
});

describe('ServiceTracker — ranking, lifecycle, and customizer edges', () => {
  let ctx: any;
  let services: Map<any, MockService>;

  beforeEach(() => {
    services = new Map();
    ctx = createTrackerContext(services);
  });

  it('getService() returns the highest-ranked tracked service object', () => {
    const low = makeServiceRef(1, 5);
    const mid = makeServiceRef(2, 10);
    const high = makeServiceRef(3, 100);
    services.set(low, { getValue: () => 'low' });
    services.set(mid, { getValue: () => 'mid' });
    services.set(high, { getValue: () => 'high' });
    ctx.getServiceReferences = vi.fn(() => [low, mid, high]);

    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    expect(tracker.getService()?.getValue()).toBe('high');
  });

  it('tracks services present before open and services arriving after open', () => {
    const preRef = makeServiceRef(1);
    const postRef = makeServiceRef(2);
    services.set(preRef, { getValue: () => 'pre' });
    ctx.getServiceReferences = vi.fn(() => [preRef]);

    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    // Pre-open service is picked up on open().
    expect(tracker.size()).toBe(1);
    expect(tracker.getServiceReferences()).toContain(preRef);

    // Post-open service arrives via a REGISTERED serviceChanged event.
    services.set(postRef, { getValue: () => 'post' });
    tracker.serviceChanged(makeServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, postRef) as any);

    expect(tracker.size()).toBe(2);
    expect(tracker.getServiceReferences()).toContain(postRef);
  });

  it('does not track when customizer.addingService returns null but still ungets', () => {
    const ref = makeServiceRef(1);
    services.set(ref, { getValue: () => 'a' });
    ctx.getServiceReferences = vi.fn(() => [ref]);
    const customizer = {
      addingService: vi.fn(() => null),
      modifiedService: vi.fn(),
      removedService: vi.fn(),
    };

    const tracker = new ServiceTracker<MockService, MockService>(ctx, 'MockService', customizer);
    tracker.open();

    expect(customizer.addingService).toHaveBeenCalledWith(ref, services.get(ref));
    expect(tracker.size()).toBe(0);
    expect(tracker.getService()).toBeNull();
    expect(ctx.ungetService).toHaveBeenCalledWith(ref);
  });

  it('fires customizer.modifiedService on a MODIFIED event for a tracked ref', () => {
    const ref = makeServiceRef(1);
    const original = { getValue: () => 'v1' };
    services.set(ref, original);
    ctx.getServiceReferences = vi.fn(() => [ref]);
    const customizer = {
      addingService: vi.fn((_r: any, s: MockService) => s),
      modifiedService: vi.fn(),
      removedService: vi.fn(),
    };

    const tracker = new ServiceTracker<MockService, MockService>(ctx, 'MockService', customizer);
    tracker.open();
    expect(customizer.modifiedService).not.toHaveBeenCalled();

    // Simulate the service object being swapped, then a MODIFIED event.
    const updated = { getValue: () => 'v2' };
    services.set(ref, updated);
    tracker.serviceChanged(makeServiceEvent(SERVICE_EVENT_TYPES.MODIFIED, ref) as any);

    expect(customizer.modifiedService).toHaveBeenCalledTimes(1);
    expect(customizer.modifiedService).toHaveBeenCalledWith(ref, updated, original);
    expect(tracker.size()).toBe(1);
  });
});
