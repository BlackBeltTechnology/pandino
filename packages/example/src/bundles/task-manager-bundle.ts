import type { BundleActivator, BundleContext, ServiceReference, ServiceRegistration } from '@pandino/pandino';
import { LoggerService } from './logger-bundle';

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface TaskManagerService {
  createTask(name: string, description: string): Task;
  getTask(id: string): Task | undefined;
  getAllTasks(): Task[];
  updateTaskStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Task | undefined;
  deleteTask(id: string): boolean;
}

class TaskManagerServiceImpl implements TaskManagerService {
  private tasks: Map<string, Task> = new Map();
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
    this.logger.info('TaskManagerService created');
  }

  createTask(name: string, description: string): Task {
    this.logger.debug('TaskManagerServiceImpl.createTask called', { name, description });
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const now = Date.now();

    const task: Task = {
      id,
      name,
      description,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    this.logger.debug('About to log task creation');
    this.logger.info(`Task created: ${name} (${id})`);
    this.logger.debug('Task creation logged, current logs:', { logs: this.logger.getLogs() });

    return task;
  }

  getTask(id: string): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) {
      this.logger.warn(`Task not found: ${id}`);
    }
    return task;
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  updateTaskStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Task | undefined {
    this.logger.debug('TaskManagerServiceImpl.updateTaskStatus called', { id, status });
    const task = this.tasks.get(id);

    if (!task) {
      this.logger.debug('Task not found, about to log warning');
      this.logger.warn(`Cannot update task status: Task not found: ${id}`);
      this.logger.debug('Warning logged, current logs:', { logs: this.logger.getLogs() });
      return undefined;
    }

    task.status = status;
    task.updatedAt = Date.now();
    this.tasks.set(id, task);

    this.logger.debug('About to log task status update');
    this.logger.info(`Task status updated: ${task.name} (${id}) -> ${status}`);
    this.logger.debug('Task status update logged, current logs:', { logs: this.logger.getLogs() });

    return task;
  }

  deleteTask(id: string): boolean {
    this.logger.debug('TaskManagerServiceImpl.deleteTask called', { id });
    const task = this.tasks.get(id);

    if (!task) {
      this.logger.debug('Task not found, about to log warning');
      this.logger.warn(`Cannot delete task: Task not found: ${id}`);
      this.logger.debug('Warning logged, current logs:', { logs: this.logger.getLogs() });
      return false;
    }

    this.tasks.delete(id);
    this.logger.debug('About to log task deletion');
    this.logger.info(`Task deleted: ${task.name} (${id})`);
    this.logger.debug('Task deletion logged, current logs:', { logs: this.logger.getLogs() });

    return true;
  }
}

class TaskManagerBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<TaskManagerService> | null = null;
  private loggerServiceRef: ServiceReference<LoggerService> | null = null;
  private taskManagerService: TaskManagerServiceImpl | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Task Manager Bundle');
      this.frameworkLogger.debug('TaskManagerBundleActivator.start called');
    }

    try {
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('About to get LoggerService reference');
      }
      this.loggerServiceRef = context.getServiceReference<LoggerService>('LoggerService');
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('LoggerService reference:', undefined, { ref: this.loggerServiceRef });
      }

      if (!this.loggerServiceRef) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('LoggerService not available, waiting...');
        }
        return; // Bundle will be in STARTING state until dependencies are available
      }

      if (this.frameworkLogger) {
        this.frameworkLogger.debug('About to get LoggerService instance');
      }
      const loggerService = context.getService<LoggerService>(this.loggerServiceRef);
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('LoggerService instance obtained:', undefined, { available: !!loggerService });
      }

      if (!loggerService) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('Failed to get LoggerService instance');
        }
        return;
      }

      if (this.frameworkLogger) {
        this.frameworkLogger.debug('Current logs from LoggerService:', undefined, { logs: loggerService.getLogs() });
      }

      if (this.frameworkLogger) {
        this.frameworkLogger.debug('About to create TaskManagerServiceImpl');
      }
      this.taskManagerService = new TaskManagerServiceImpl(loggerService);
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('About to register TaskManagerService');
      }
      this.serviceRegistration = context.registerService<TaskManagerService>(
        'TaskManagerService',
        this.taskManagerService,
        {
          'service.description': 'Task manager service',
          'service.vendor': 'Pandino Showcase',
        },
      );
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('TaskManagerService registered');
      }

      if (this.frameworkLogger) {
        this.frameworkLogger.debug('About to log bundle start');
      }
      loggerService.info(`Task Manager Bundle (ID: ${context.getBundle().getBundleId()}) started`);
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('Current logs after bundle start:', undefined, { logs: loggerService.getLogs() });
      }

      if (this.frameworkLogger) {
        this.frameworkLogger.info('Task Manager Bundle started');
      }
    } catch (error) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error starting Task Manager Bundle:', error as Error);
      }
    }
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Task Manager Bundle');
    }

    if (this.loggerServiceRef) {
      const loggerService = context.getService<LoggerService>(this.loggerServiceRef);
      if (loggerService) {
        loggerService.info(`Task Manager Bundle (ID: ${context.getBundle().getBundleId()}) stopping`);
      }
      context.ungetService(this.loggerServiceRef);
      this.loggerServiceRef = null;
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Task Manager Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/task-manager',
    bundleVersion: '1.0.0',
    bundleName: 'Task Manager Bundle',
  },
  activator: new TaskManagerBundleActivator(),
};
