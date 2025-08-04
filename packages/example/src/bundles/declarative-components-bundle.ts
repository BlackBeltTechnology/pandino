import type { BundleActivator, BundleContext, ServiceReference } from '@pandino/pandino';
import type { ServiceComponentRuntime } from '@pandino/pandino';
import { Component, Service, Reference, Activate, Deactivate, Modified } from '@pandino/decorators';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UserService {
  getUser(id: string): User | null;
  getAllUsers(): User[];
  createUser(name: string, email: string, role: string): User;
  updateUser(id: string, updates: Partial<Omit<User, 'id'>>): User | null;
  deleteUser(id: string): boolean;
}

export interface NotificationService {
  sendNotification(userId: string, message: string): void;
  getUserNotifications(userId: string): Array<{
    id: string;
    userId: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  markAsRead(notificationId: string): boolean;
  getAllNotifications(): Array<{
    id: string;
    userId: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
}

export interface AuthorizationService {
  hasPermission(userId: string, permission: string): boolean;
  getUserPermissions(userId: string): string[];
  grantPermission(userId: string, permission: string): void;
  revokePermission(userId: string, permission: string): void;
}

@Component({
  name: 'user.service',
  immediate: true,
})
@Service({
  interfaces: ['UserService'],
})
export class UserServiceImpl implements UserService {
  private users: Map<string, User> = new Map();

  @Activate
  activate(): void {
    console.log('UserService activated');

    // Add some sample users
    this.createUser('John Doe', 'john.doe@example.com', 'admin');
    this.createUser('Jane Smith', 'jane.smith@example.com', 'user');
    this.createUser('Bob Johnson', 'bob.johnson@example.com', 'user');
  }

  @Deactivate
  deactivate(): void {
    console.log('UserService deactivated');
    this.users.clear();
  }

  getUser(id: string): User | null {
    return this.users.get(id) || null;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  createUser(name: string, email: string, role: string): User {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const user: User = { id, name, email, role };
    this.users.set(id, user);
    return user;
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id'>>): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }
}

@Component({
  name: 'notification.service',
  immediate: true,
})
@Service({
  interfaces: ['NotificationService'],
})
export class NotificationServiceImpl implements NotificationService {
  private notifications: Array<{
    id: string;
    userId: string;
    message: string;
    timestamp: number;
    read: boolean;
  }> = [];

  @Reference({
    interface: 'UserService',
    cardinality: '1..1',
    policy: 'static',
  })
  private userService!: UserService;

  @Activate
  activate(): void {
    console.log('NotificationService activated');

    // Add some sample notifications
    this.sendNotification('user1', 'Welcome to the system!');
    this.sendNotification('user2', 'You have a new message.');
  }

  @Deactivate
  deactivate(): void {
    console.log('NotificationService deactivated');
    this.notifications = [];
  }

  sendNotification(userId: string, message: string): void {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const user = this.userService.getUser(userId);
    const actualUserId = user ? user.id : userId;

    this.notifications.push({
      id,
      userId: actualUserId,
      message,
      timestamp: Date.now(),
      read: false,
    });
  }

  getUserNotifications(userId: string): Array<{
    id: string;
    userId: string;
    message: string;
    timestamp: number;
    read: boolean;
  }> {
    return this.notifications.filter((notification) => notification.userId === userId);
  }

  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    return true;
  }

  getAllNotifications(): Array<{
    id: string;
    userId: string;
    message: string;
    timestamp: number;
    read: boolean;
  }> {
    return [...this.notifications];
  }
}

@Component({
  name: 'authorization.service',
  immediate: false,
  configurationPid: 'authorization.settings',
})
@Service({
  interfaces: ['AuthorizationService'],
})
export class AuthorizationServiceImpl implements AuthorizationService {
  private userPermissions: Map<string, Set<string>> = new Map();
  private strictMode: boolean = false;

  @Reference({
    interface: 'UserService',
    cardinality: '1..1',
    policy: 'static',
  })
  private userService!: UserService;

  @Reference({
    interface: 'NotificationService',
    cardinality: '0..1',
    policy: 'dynamic',
  })
  private notificationService?: NotificationService;

  @Activate
  activate(): void {
    console.log('AuthorizationService activated');

    // Add some sample permissions
    const users = this.userService.getAllUsers();

    users.forEach((user) => {
      if (user.role === 'admin') {
        this.grantPermission(user.id, 'user:create');
        this.grantPermission(user.id, 'user:read');
        this.grantPermission(user.id, 'user:update');
        this.grantPermission(user.id, 'user:delete');
      } else {
        this.grantPermission(user.id, 'user:read');
      }
    });
  }

  @Modified
  modified(properties: Record<string, any>): void {
    console.log('AuthorizationService configuration modified:', properties);

    if (properties.strictMode !== undefined) {
      this.strictMode = properties.strictMode;
      console.log(`Strict mode ${this.strictMode ? 'enabled' : 'disabled'}`);
    }
  }

  @Deactivate
  deactivate(): void {
    console.log('AuthorizationService deactivated');
    this.userPermissions.clear();
  }

  hasPermission(userId: string, permission: string): boolean {
    const permissions = this.userPermissions.get(userId);
    if (!permissions) return false;

    return permissions.has(permission);
  }

  getUserPermissions(userId: string): string[] {
    const permissions = this.userPermissions.get(userId);
    if (!permissions) return [];

    return Array.from(permissions);
  }

  grantPermission(userId: string, permission: string): void {
    const user = this.userService.getUser(userId);
    if (!user && this.strictMode) {
      throw new Error(`User ${userId} not found`);
    }

    const actualUserId = user ? user.id : userId;

    if (!this.userPermissions.has(actualUserId)) {
      this.userPermissions.set(actualUserId, new Set());
    }

    this.userPermissions.get(actualUserId)!.add(permission);

    if (this.notificationService) {
      this.notificationService.sendNotification(actualUserId, `You have been granted the permission: ${permission}`);
    }
  }

  revokePermission(userId: string, permission: string): void {
    const permissions = this.userPermissions.get(userId);
    if (!permissions) return;

    permissions.delete(permission);

    if (this.notificationService) {
      this.notificationService.sendNotification(userId, `The permission has been revoked: ${permission}`);
    }
  }

  isStrictMode(): boolean {
    return this.strictMode;
  }
}

@Component({
  name: 'user.manager',
  immediate: true,
})
export class UserManagerComponent {
  @Reference({
    interface: 'UserService',
    cardinality: '1..1',
    policy: 'static',
  })
  private userService!: UserService;

  @Reference({
    interface: 'NotificationService',
    cardinality: '0..1',
    policy: 'dynamic',
  })
  private notificationService?: NotificationService;

  @Reference({
    interface: 'AuthorizationService',
    cardinality: '0..1',
    policy: 'dynamic',
  })
  private authorizationService?: AuthorizationService;

  @Activate
  activate(): void {
    console.log('UserManager activated');
  }

  @Deactivate
  deactivate(): void {
    console.log('UserManager deactivated');
  }
}

class DeclarativeComponentsBundleActivator implements BundleActivator {
  private scrRef: ServiceReference<ServiceComponentRuntime> | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Declarative Components Bundle');
    }

    try {
      this.scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');

      if (!this.scrRef) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('ServiceComponentRuntime not available, waiting...');
        }
        return; // Bundle will be in STARTING state until dependencies are available
      }

      // Get the SCR service instance
      const scr = context.getService<ServiceComponentRuntime>(this.scrRef);

      if (!scr) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('Failed to get ServiceComponentRuntime instance');
        }
        return;
      }

      const bundleId = context.getBundle().getBundleId();

      await scr.registerComponent(UserServiceImpl, bundleId);
      await scr.registerComponent(NotificationServiceImpl, bundleId);
      await scr.registerComponent(AuthorizationServiceImpl, bundleId);
      await scr.registerComponent(UserManagerComponent, bundleId);

      if (this.frameworkLogger) {
        this.frameworkLogger.info('Declarative Components Bundle started');
      }
    } catch (error) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error starting Declarative Components Bundle:', error as Error);
      }
    }
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Declarative Components Bundle');
    }

    if (this.scrRef) {
      context.ungetService(this.scrRef);
      this.scrRef = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Declarative Components Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/declarative-components',
    bundleVersion: '1.0.0',
    bundleName: 'Declarative Components Bundle',
  },
  activator: new DeclarativeComponentsBundleActivator(),
};
