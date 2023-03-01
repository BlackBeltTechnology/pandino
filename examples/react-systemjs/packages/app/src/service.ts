export const SOME_SERVICE_INTERFACE_KEY = 'SomeService';

export interface SomeService {
  someMethod(): string;
}

export class SomeServiceImpl implements SomeService {
  someMethod(): string {
    return "some fine service";
  }
}
