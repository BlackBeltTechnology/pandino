import { Resource } from './resource';

/**
 * A capability that has been declared from a {@link Resource}.
 */
export interface Capability {
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getResource(): Resource;
  equals(other: any): boolean;
}
