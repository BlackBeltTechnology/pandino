import type { Matcher } from './matcher';

export class MatcherAll implements Matcher {
  match(className: string): boolean {
    return true;
  }
}
