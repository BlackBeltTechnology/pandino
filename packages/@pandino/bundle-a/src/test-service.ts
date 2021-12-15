export interface TestService {
  test(text: string): string;
}

export class TestServiceImpl implements TestService {
  test(text: string): string {
    return text.split('').reverse().join('');
  }
}
