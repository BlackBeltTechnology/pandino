import {
  BundleActivator,
  BundleContext,
  BundleEvent,
  BundleListener,
  BundleState,
} from '@pandino/pandino-api';

interface BundleStat {
  id: number;
  manifestLocation: string;
  symbolicName: string;
  version: string;
  state: BundleState;
}

interface BundleStats {
  INSTALLED: Array<BundleStat>;
  STARTING: Array<BundleStat>;
  ACTIVE: Array<BundleStat>;
  STOPPING: Array<BundleStat>;
  UNINSTALLED: Array<BundleStat>;
}

export default class PandinoBundleInstallerDomActivator implements BundleActivator {
  private statusBar: StatusBar;
  private currentTagName = 'pandino-mission-control-dom';
  private body: HTMLBodyElement;

  async start(context: BundleContext): Promise<void> {
    this.body = document.querySelector('body');
    customElements.define(this.currentTagName, StatusBar);
    customElements.define(`${this.currentTagName}-bundle-table`, BundleTable);
    this.statusBar = new StatusBar(context);
    this.body.appendChild(this.statusBar);
  }

  async stop(context: BundleContext): Promise<void> {
    const statusBarEl = document.querySelector(this.currentTagName);
    this.body.removeChild(statusBarEl);
  }
}

class BundleTable extends HTMLElement {
  private shadow: ShadowRoot;
  private type: BundleState;
  private stats: BundleStat[] = [];
  private context: BundleContext;
  private actionButtons: HTMLButtonElement[] = [];

  constructor(type: BundleState, stats: Array<BundleStat>, context: BundleContext) {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.type = type || ('Unknown' as any);
    this.stats = stats;
    this.stats.sort((a, b) => a.symbolicName.localeCompare(b.symbolicName));
    this.context = context;
  }

  connectedCallback() {
    this.render();
    this.actionButtons = Array.from(this.shadow.querySelectorAll('.mc-bundle-table button'));
    this.actionButtons.forEach((b) => {
      b.addEventListener('click', this.triggerAction.bind(this));
    });
  }

  disconnectedCallback() {
    this.actionButtons.forEach((b) => {
      b.removeEventListener('click', this.triggerAction.bind(this));
    });
  }

  private triggerAction(event: Event): void {
    const attrs = (event.target as HTMLButtonElement).attributes;
    const action: string = attrs.getNamedItem('data-mc-action').value;
    const bundleId: number = Number(attrs.getNamedItem('data-mc-bundle-id').value);
    const manifestLocation: string = this.stats.find((s) => s.id === bundleId).manifestLocation;

    switch (action) {
      case 'start':
        this.context.getBundle(bundleId).start();
        break;
      case 'stop':
        this.context.getBundle(bundleId).stop();
        break;
      case 'install':
        this.context.installBundle(manifestLocation);
        break;
      case 'uninstall':
        this.context.getBundle(bundleId).uninstall();
        break;
      default:
        console.warn(`Unknown action type: ${action}`);
    }
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        .mc-bundle-table {
          max-height: 480px;
          overflow-y: auto;
          text-align: initial;
        }
        .mc-bundle-table table {
          width: 100%;
        }
        .mc-bundle-table button {
          cursor: pointer;
        }
        .mc-bundle-table tr td, .mc-bundle-table tr th {
          padding: .5rem;
        }
        .mc-bundle-table tbody tr:hover {
          background-color: var(--pandino-mc-bundle-table-hover-bg, #e7501d);
          color: var(--pandino-mc-bundle-table-hover-text, #f8f9fa);
        }
        .mc-bundle-table .mc-bundle-table-action-items {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 12px;
        }
      </style>
      <div class="mc-bundle-table">
        <table>
          <thead>
            <tr>
              <th>ID:</th>
              <th>Symbolic Name:</th>
              <th>Version:</th>
              <th>Actions:</th>
            </tr>
          </thead>
          <tbody>
            ${this.stats
              .map(
                (a) => `
              <tr>
                <td>${a.id}</td>
                <td>${a.symbolicName}</td>
                <td>${a.version}</td>
                <td class="mc-bundle-table-action-items">
                  ${
                    a.state === 'INSTALLED'
                      ? `
                    <button type="button" class="btn btn-sm" data-mc-action="start" data-mc-bundle-id="${a.id}">
                      start
                    </button>
                  `
                      : ``
                  }
                  ${
                    a.state === 'ACTIVE'
                      ? `
                    <button type="button" class="btn btn-sm" data-mc-action="stop" data-mc-bundle-id="${a.id}">
                      stop
                    </button>
                  `
                      : ``
                  }
                  ${
                    a.state === 'UNINSTALLED'
                      ? `
                    <button type="button" class="btn btn-sm" data-mc-action="install" data-mc-bundle-id="${a.id}">
                      install
                    </button>
                  `
                      : ``
                  }
                  ${
                    a.state !== 'UNINSTALLED'
                      ? `
                    <button type="button" class="btn btn-sm" data-mc-action="uninstall" data-mc-bundle-id="${a.id}">
                      uninstall
                    </button>
                  `
                      : ``
                  }
                </td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  }
}

class StatusBar extends HTMLElement {
  private shadow: ShadowRoot;
  private context: BundleContext;
  private listener: BundleListener;
  private stats: BundleStats = {
    INSTALLED: [],
    STARTING: [],
    ACTIVE: [],
    STOPPING: [],
    UNINSTALLED: [],
  };

  constructor(context: BundleContext) {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.context = context;
  }

  private updateStats(): void {
    this.stats = {
      INSTALLED: [],
      STARTING: [],
      ACTIVE: [],
      STOPPING: [],
      UNINSTALLED: [],
    };
    this.context.getBundles().forEach((bundle) => {
      // @ts-ignore
      this.stats[bundle.getState() as any].push({
        id: bundle.getBundleId(),
        manifestLocation: bundle.getLocation(),
        symbolicName: bundle.getSymbolicName(),
        state: bundle.getState(),
        version: bundle.getVersion().toString(),
      });
    });
  }

  private updateStatsNumbersDisplay(): void {
    const installedSpan = this.shadow.querySelector('span.mc-bundle-installed');
    const startingSpan = this.shadow.querySelector('span.mc-bundle-starting');
    const activeSpan = this.shadow.querySelector('span.mc-bundle-active');
    const stoppingSpan = this.shadow.querySelector('span.mc-bundle-stopping');
    const uninstalledSpan = this.shadow.querySelector('span.mc-bundle-uninstalled');

    installedSpan.textContent = this.stats.INSTALLED.length.toString();
    startingSpan.textContent = this.stats.STARTING.length.toString();
    activeSpan.textContent = this.stats.ACTIVE.length.toString();
    stoppingSpan.textContent = this.stats.STOPPING.length.toString();
    uninstalledSpan.textContent = this.stats.UNINSTALLED.length.toString();

    const dropUpContextInstalled = this.shadow.querySelector('.dropup-content.bundle-installed');
    const dropUpContextStarting = this.shadow.querySelector('.dropup-content.bundle-starting');
    const dropUpContextActive = this.shadow.querySelector('.dropup-content.bundle-active');
    const dropUpContextStopping = this.shadow.querySelector('.dropup-content.bundle-stopping');
    const dropUpContextUninstalled = this.shadow.querySelector('.dropup-content.bundle-uninstalled');

    dropUpContextInstalled.innerHTML = '';
    dropUpContextInstalled.appendChild(new BundleTable('INSTALLED', this.stats.INSTALLED, this.context));
    dropUpContextStarting.innerHTML = '';
    dropUpContextStarting.appendChild(new BundleTable('STARTING', this.stats.STARTING, this.context));
    dropUpContextActive.innerHTML = '';
    dropUpContextActive.appendChild(new BundleTable('ACTIVE', this.stats.ACTIVE, this.context));
    dropUpContextStopping.innerHTML = '';
    dropUpContextStopping.appendChild(new BundleTable('STOPPING', this.stats.STOPPING, this.context));
    dropUpContextUninstalled.innerHTML = '';
    dropUpContextUninstalled.appendChild(new BundleTable('UNINSTALLED', this.stats.UNINSTALLED, this.context));
  }

  connectedCallback(): void {
    this.updateStats();
    this.listener = {
      isSync: true,
      bundleChanged: (_: BundleEvent) => {
        this.updateStats();
        this.updateStatsNumbersDisplay();
      },
    };
    this.context.addBundleListener(this.listener);
    this.render();
    this.updateStatsNumbersDisplay();
  }

  disconnectedCallback(): void {
    this.context.removeBundleListener(this.listener);
  }

  render(): void {
    this.shadow.innerHTML = `
      <style>
        .mc-status {
          background-color: var(--pandino-mc-text-primary, #191c1f);
          position: fixed;
          bottom: 0;
          width: 100%;
          z-index: 500;
          display: flex;
        }
        .mc-status .mc-status-item {
          color: var(--pandino-mc-background-primary, #f8f9fa);
          text-align: center;
          padding: .5rem 1rem;
        }
        .mc-status .mc-status-item:hover {
          background-color: var(--pandino-mc-background-primary, #f8f9fa);
          color: var(--pandino-mc-text-primary, #191c1f);
          cursor: pointer;
        }
        .mc-status .mc-status-item.primary {
          background-color: var(--pandino-mc-link-primary, #e7501d);
          color: var(--pandino-mc-background-primary, #f8f9fa);
        }
        .mc-status .mc-status-item.dropup {
          position: relative;
          display: inline-block;
        }
        .mc-status .mc-status-item .dropup-content {
          cursor: default;
          display: none;
          position: absolute;
          min-width: 640px;
          bottom: 2.3rem;
          z-index: 501;
          margin: 0 -18px;
          background-color: var(--pandino-mc-background-primary, #f8f9fa);
          border-left: 2px solid var(--pandino-mc-text-primary, #191c1f);
          border-right: 2px solid var(--pandino-mc-text-primary, #191c1f);
          border-top: 2px solid var(--pandino-mc-text-primary, #191c1f);
          box-sizing: border-box;
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
        }
        .mc-status .mc-status-item.dropup:hover .dropup-content {
          display: block;
        }
      </style>
      <div class="mc-status">
        <div class="mc-status-item primary">
          Pandino
        </div>
        <div class="mc-status-item dropup">
          Installed (<span class="mc-bundle-installed">${this.stats.INSTALLED.length}</span>)
          <div class="dropup-content bundle-installed">
            <!-- CONTENT GOES HERE -->
          </div>
        </div>
        <div class="mc-status-item dropup">
          Starting (<span class="mc-bundle-starting">${this.stats.STARTING.length}</span>)
          <div class="dropup-content bundle-starting">
            <!-- CONTENT GOES HERE -->
          </div>
        </div>
        <div class="mc-status-item dropup">
          Active (<span class="mc-bundle-active">${this.stats.ACTIVE.length}</span>)
          <div class="dropup-content bundle-active">
            <!-- CONTENT GOES HERE -->
          </div>
        </div>
        <div class="mc-status-item dropup">
          Stopping (<span class="mc-bundle-stopping">${this.stats.STOPPING.length}</span>)
          <div class="dropup-content bundle-stopping">
            <!-- CONTENT GOES HERE -->
          </div>
        </div>
        <div class="mc-status-item dropup">
          Uninstalled (<span class="mc-bundle-uninstalled">${this.stats.UNINSTALLED.length}</span>)
          <div class="dropup-content bundle-uninstalled">
            <!-- CONTENT GOES HERE -->
          </div>
        </div>
      </div>
    `;
  }
}
