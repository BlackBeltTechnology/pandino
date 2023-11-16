import type { Resource } from './resource';

/**
 * A requirement that has been declared from a {@link Resource} .
 */
export interface Requirement {
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getResource(): Resource;
}
