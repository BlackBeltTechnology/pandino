import {
  BUNDLE_NAME,
  BundleActivator,
  BundleContext,
  BundleEvent,
  BundleListener,
  BundleState,
} from '@pandino/pandino-api';

interface BundleStat {
  name: string;
  symbolicName: string;
  version: string;
  state: BundleState;
}

interface BundleStats {
  INSTALLED: Array<BundleStat>;
  RESOLVED: Array<BundleStat>;
  STARTING: Array<BundleStat>;
  ACTIVE: Array<BundleStat>;
  STOPPING: Array<BundleStat>;
  UNINSTALLED: Array<BundleStat>;
}

export default class PandinoBundleInstallerDomActivator implements BundleActivator {
  private statusBar: StatusBar;
  private currentTagName: string;
  private body: HTMLBodyElement;

  async start(context: BundleContext): Promise<void> {
    this.body = document.querySelector('body');
    this.currentTagName = this.createTagName();
    customElements.define(this.currentTagName, StatusBar);
    this.statusBar = new StatusBar(context);
    this.body.appendChild(this.statusBar);
  }

  async stop(context: BundleContext): Promise<void> {
    const statusBarEl = document.querySelector(this.currentTagName);
    this.body.removeChild(statusBarEl);
  }

  private createTagName(): string {
    const charSet = 'abcdefghij';
    const postfix = new Date()
      .getMilliseconds()
      .toString()
      .split('')
      .map((c) => charSet[Number(c)])
      .join('');
    return `pandino-mission-control-dom-${postfix}`;
  }
}

class StatusBar extends HTMLElement {
  private shadow: ShadowRoot;
  private context: BundleContext;
  private listener: BundleListener;
  private stats: BundleStats = {
    INSTALLED: [],
    RESOLVED: [],
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
      RESOLVED: [],
      STARTING: [],
      ACTIVE: [],
      STOPPING: [],
      UNINSTALLED: [],
    };
    this.context.getBundles().forEach((bundle) => {
      // @ts-ignore
      this.stats[bundle.getState() as any].push({
        name: bundle.getHeaders()[BUNDLE_NAME],
        symbolicName: bundle.getSymbolicName(),
        state: bundle.getState(),
        version: bundle.getVersion().toString(),
      });
    });
  }

  connectedCallback(): void {
    this.updateStats();
    this.listener = {
      isSync: true,
      bundleChanged: (_: BundleEvent) => {
        this.updateStats();
        this.render();
      },
    };
    this.context.addBundleListener(this.listener);
    this.render();
  }

  disconnectedCallback(): void {
    this.context.removeBundleListener(this.listener);
  }

  render(): void {
    this.shadow.innerHTML = `
      <style>
        .navbar {
          background-color: var(--pandino-mc-text-primary, #191c1f);
          overflow: hidden;
          position: fixed;
          bottom: 0;
          width: 100%;
          z-index: 500;
        }
        .navbar .navbar-item {
          float: left;
          display: block;
          color: var(--pandino-mc-backgroup-primary, #f8f9fa);
          text-align: center;
          padding: .5rem 1rem;
        }
        .navbar .navbar-item:hover {
          background-color: var(--pandino-mc-backgroup-primary, #f8f9fa);
          color: var(--pandino-mc-text-primary, #191c1f);
          cursor: pointer;
        }
        .navbar .navbar-item.primary {
          background-color: var(--pandino-mc-link-primary, #e7501d);
          color: var(--pandino-mc-backgroup-primary, #f8f9fa);
        }
      </style>
      <div class="navbar">
        <div class="navbar-item primary">
          Pandino
        </div>
        <div class="navbar-item" title="${this.stats.INSTALLED.map((a) => a.symbolicName).join(', ')}">
          Installed (${this.stats.INSTALLED.length})
        </div>
        <div class="navbar-item" title="${this.stats.RESOLVED.map((a) => a.symbolicName).join(', ')}">
          Resolved (${this.stats.RESOLVED.length})
        </div>
        <div class="navbar-item" title="${this.stats.STARTING.map((a) => a.symbolicName).join(', ')}">
          Starting (${this.stats.STARTING.length})
        </div>
        <div class="navbar-item" title="${this.stats.ACTIVE.map((a) => a.symbolicName).join(', ')}">
            Active (${this.stats.ACTIVE.length})
        </div>
        <div class="navbar-item" title="${this.stats.STOPPING.map((a) => a.symbolicName).join(', ')}">
          Stopped (${this.stats.STOPPING.length})
        </div>
        <div class="navbar-item" title="${this.stats.UNINSTALLED.map((a) => a.symbolicName).join(', ')}">
          Uninstalled (${this.stats.UNINSTALLED.length})
        </div>
      </div> 
    `;
  }
}
