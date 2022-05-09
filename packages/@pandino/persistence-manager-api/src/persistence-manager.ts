/**
 * The <code>PersistenceManager</code> interface defines the API to be implemented to support persisting configuration
 * data. This interface may be implemented by bundles, which support storing configuration data in different locations.
 */
import { ServiceProperties } from '@pandino/pandino-api';

export interface PersistenceManager {
  /**
   * Returns <code>true</code> if a persisted <code>Dictionary</code> exists for the given <code>pid</code>.
   * @param {string} pid
   */
  exists(pid: string): boolean;

  /**
   * Returns the <code>ServiceProperties</code> for the given <code>pid</code>.
   * <p>
   * Implementations are expected to return ServiceProperties instances which may be modified by the caller without
   * affecting any underlying data or affecting future calls to this method with the same PID. In other words the
   * reference equation <code>!load(pid).equals(load(pid))</code> must hold <code>true</code>.
   *
   * @param {string} pid
   */
  load(pid: string): ServiceProperties | undefined;

  /**
   * Returns an enumeration of all <code>Dictionary</code> objects known to this persistence manager.
   *
   * Implementations are expected to return ServiceProperties instances which may be modified by the caller without
   * affecting any underlying data or affecting future calls to this method.
   */
  getProperties(): ServiceProperties[];

  /**
   * Stores the <code>Dictionary</code> under the given <code>pid</code>.
   * <p>
   * The ServiceProperties provided to this method must be considered private to the caller. Any modification by the
   * caller after this method finishes must not influence any internal storage of the provided data. Implementations
   * must not modify the ServiceProperties.
   *
   * @param {string} pid
   * @param {ServiceProperties} properties
   */
  store(pid: string, properties: ServiceProperties): void;

  /**
   * Removes the <code>ServiceProperties</code> for the given <code>pid</code>. If such a ServiceProperties does not
   * exist, this method has no effect.
   *
   * @param {string} pid
   */
  delete(pid: string): void;
}
