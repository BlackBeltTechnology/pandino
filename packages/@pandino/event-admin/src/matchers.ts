import { ClassMatcher, Matcher, MatcherAll, PackageMatcher, SEP_PCK, SEP_TOPIC, SubPackageMatcher } from './matcher';

export class Matchers {
  static createEventTopicMatchers(config: string[] = []): Matcher[] {
    const list: Matcher[] = [];
    for (let i = 0; i < config.length; i++) {
      let value = config[i];
      if (value !== null && value !== undefined) {
        value = value.trim();
      }

      if (value !== null && value !== undefined && value.length > 0) {
        if (value.endsWith('.')) {
          list.push(new PackageMatcher(value.substring(0, value.length - 1), SEP_TOPIC));
        } else if (value.endsWith('*')) {
          if (value === '*') {
            return [new MatcherAll()];
          }
          list.push(new SubPackageMatcher(value.substring(0, value.length - 1), SEP_TOPIC));
        } else {
          list.push(new ClassMatcher(value));
        }
      }
    }
    if (list.length > 0) {
      return list;
    }

    return [];
  }

  static createPackageMatchers(ignoreTimeout: string[] = []): Matcher[] {
    const ignoreTimeoutMatcher: Matcher[] = [];

    for (let i = 0; i < ignoreTimeout.length; i++) {
      let value = ignoreTimeout[i];
      if (value !== null && value !== undefined) {
        value = value.trim();
      }

      if (value !== null && value !== undefined && value.length > 0) {
        if (value.endsWith('.')) {
          ignoreTimeoutMatcher[i] = new PackageMatcher(value.substring(0, value.length - 1), SEP_PCK);
        } else if (value.endsWith('*')) {
          ignoreTimeoutMatcher[i] = new SubPackageMatcher(value.substring(0, value.length - 1), SEP_PCK);
        } else {
          ignoreTimeoutMatcher[i] = new ClassMatcher(value);
        }
      }
    }
    return ignoreTimeoutMatcher;
  }
}
