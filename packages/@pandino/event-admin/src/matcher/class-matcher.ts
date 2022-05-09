import { Matcher } from './matcher';

export class ClassMatcher implements Matcher {
  private readonly className: string;

  constructor(className: string) {
    this.className = className;
  }

  match(className: string): boolean {
    return this.className === className;
  }
}
