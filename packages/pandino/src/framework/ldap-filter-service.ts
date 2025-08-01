import type { LdapFilterService } from './interfaces';
import { LDAPFilter } from './ldap-filter';

export class LdapFilterServiceImpl implements LdapFilterService {
  match(filter: string, properties: Record<string, any>): boolean {
    const ldapFilter = new LDAPFilter(filter);
    return ldapFilter.match(properties);
  }

  validateFilter(filter: string): boolean {
    try {
      new LDAPFilter(filter);
      return true;
    } catch {
      return false;
    }
  }
}
