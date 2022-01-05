import { Logger, LogLevel } from '@pandino/pandino-api';

export class DomLogger implements Logger {
  private readonly logUl: HTMLElement;
  private level: LogLevel = LogLevel.LOG;

  constructor(domContainer: HTMLElement) {
    this.logUl = document.createElement('ul');
    this.logUl.setAttribute('style', 'list-style="none"');
    domContainer.appendChild(this.logUl);
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...data: any[]): void {
    this.justPrint('#666', ...data);
  }

  error(...data: any[]): void {
    this.justPrint('#a82222', ...data);
  }

  info(...data: any[]): void {
    this.justPrint('#2d96ad', ...data);
  }

  log(...data: any[]): void {
    this.justPrint('#666', ...data);
  }

  trace(...data: any[]): void {
    this.justPrint('#999', ...data);
  }

  warn(...data: any[]): void {
    this.justPrint('#e0660a', ...data);
  }

  private justPrint(color: string, ...data: any[]) {
    const liItem = document.createElement('li');
    liItem.textContent = data.map((e) => e.toString()).join('\n');
    liItem.setAttribute('style', `color:${color}`);
    this.logUl.appendChild(liItem);
  }
}
