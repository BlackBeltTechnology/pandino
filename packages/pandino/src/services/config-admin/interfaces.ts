/**
 * Service for managing runtime configurations. Configurations are identified
 * by a PID (persistent identifier) and delivered to matching {@link ManagedService} instances.
 * Obtain via `context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin')`.
 */
export interface ConfigurationAdmin {
  /** Gets or creates a configuration for the given PID. */
  getConfiguration(pid: string, location?: string): Promise<Configuration>;
  /** Creates a new factory configuration. Each call returns a unique PID. */
  createFactoryConfiguration(factoryPid: string, location?: string): Promise<Configuration>;
  /** Lists configurations matching the optional LDAP filter, or null if none match. */
  listConfigurations(filter?: string): Promise<Configuration[] | null>;
}

/** A single configuration identified by a PID, holding key-value properties. */
export interface Configuration {
  /** Returns the persistent identifier for this configuration. */
  getPid(): string;
  /** Returns the factory PID if this is a factory configuration, or null. */
  getFactoryPid(): string | null;
  /** Returns the current properties, or null if not yet updated. */
  getProperties(): Record<string, any> | null;
  /** Updates the configuration properties. Triggers delivery to the matching ManagedService. */
  update(properties: Record<string, any>): Promise<void>;
  /** Deletes this configuration. */
  delete(): Promise<void>;
  /** Returns the bound bundle location, or null. */
  getBundleLocation(): string | null;
  /** Binds this configuration to a specific bundle location. */
  setBundleLocation(location: string | null): Promise<void>;
}

/**
 * Implement this interface and register with a `service.pid` property to
 * receive configuration updates from {@link ConfigurationAdmin}.
 */
export interface ManagedService {
  /** Called when the configuration for this service's PID is updated or deleted (null). */
  updated(properties: Record<string, any> | null): void | Promise<void>;
}

/**
 * Factory variant of {@link ManagedService} for managing multiple configuration
 * instances under a single factory PID.
 */
export interface ManagedServiceFactory {
  /** Returns a human-readable name for this factory. */
  getName(): string;
  /** Called when a factory configuration instance is created or updated. */
  updated(pid: string, properties: Record<string, any>): void | Promise<void>;
  /** Called when a factory configuration instance is deleted. */
  deleted(pid: string): void | Promise<void>;
}

/** Types of configuration events. */
export enum ConfigurationEventType {
  UPDATED = 1,
  DELETED = 2,
}

/** Event emitted when a configuration is updated or deleted. */
export interface ConfigurationEvent {
  /** Returns the PID of the affected configuration. */
  getPid(): string;
  /** Returns the factory PID, or null if not a factory configuration. */
  getFactoryPid(): string | null;
  /** Returns the event type (UPDATED or DELETED). */
  getType(): ConfigurationEventType;
}

/** Listener for configuration change events. */
export interface ConfigurationListener {
  /** Called when a configuration event occurs. */
  configurationEvent(event: ConfigurationEvent): void;
}
