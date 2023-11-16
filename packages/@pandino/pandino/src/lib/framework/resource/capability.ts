import type { Resource } from './resource';

/**
 * A capability that has been declared from a {@link Resource}.
 */
export interface Capability {
  getNamespace(): string | undefined;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getResource(): Resource | undefined;
  equals(other: any): boolean;
}
