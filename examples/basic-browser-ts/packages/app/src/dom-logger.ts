import { Logger, LogLevel } from '@pandino/pandino-api';

export class DomLogger implements Logger {
  private readonly logContainer: HTMLElement;
  private level: LogLevel = LogLevel.LOG;

  constructor(domContainer: HTMLElement) {
    this.logContainer = document.createElement('table');
    domContainer.appendChild(this.logContainer);
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...data: any[]): void {
    this.justPrint('#999', '[DEBUG]', ...data);
  }

  error(...data: any[]): void {
    this.justPrint('#a82222', '[ERROR]', ...data);
  }

  info(...data: any[]): void {
    this.justPrint('#2d96ad', '[INFO]', ...data);
  }

  log(...data: any[]): void {
    this.justPrint('#333', '[LOG]', ...data);
  }

  trace(...data: any[]): void {
    this.justPrint('#999', '[TRACE]', ...data);
  }

  warn(...data: any[]): void {
    this.justPrint('#e0660a', '[WARN]', ...data);
  }

  private justPrint(color: string, level: string, ...data: any[]) {
    const cellPadding = 'padding:.25rem';
    const logEntryElement = document.createElement('tr');
    const dateCell = document.createElement('td');
    const levelCell = document.createElement('td');
    const messageCell = document.createElement('td');

    dateCell.textContent = new Date().toISOString();
    dateCell.setAttribute('style', cellPadding);
    levelCell.textContent = level;
    levelCell.setAttribute('style', cellPadding);
    messageCell.textContent = data.map((e) => e.toString()).join('');
    messageCell.setAttribute('style', cellPadding);

    logEntryElement.setAttribute('style', `color:${color}`);
    logEntryElement.appendChild(dateCell);
    logEntryElement.appendChild(levelCell);
    logEntryElement.appendChild(messageCell);

    this.logContainer.appendChild(logEntryElement);
  }
}
