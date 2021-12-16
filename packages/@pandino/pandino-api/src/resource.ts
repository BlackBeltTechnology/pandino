/**
 * https://docs.osgi.org/specification/osgi.core/8.0.0/framework.resource.html
 */

/**
 * A requirement that has been declared from a {@link Resource} .
 */
export interface Requirement {
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getResource(): Resource;
}

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

export interface Resource {
  getCapabilities(namespace: string): Capability[];
  getRequirements(namespace: string): Requirement[];
  equals(other: any): boolean;
}

/**
 * A wire connecting a {@link Capability} to a {@link Requirement}.
 */
export interface Wire {
  getCapability(): Capability;
  getRequirement(): Requirement;
  getProvider(): Resource;
  getRequirer(): Resource;
  equals(other: any): boolean;
}
