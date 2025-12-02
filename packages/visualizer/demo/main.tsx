import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OSGiBootstrap, type OSGiFramework, LogLevel } from '@pandino/pandino';
import { PandinoVisualizer, PandinoVisualizerProvider } from '../src/index.tsx';

function Demo() {
  const [framework, setFramework] = useState<OSGiFramework | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initFramework() {
      try {
        const bootstrap = new OSGiBootstrap({
          frameworkLogLevel: LogLevel.INFO,
        });

        const fw = await bootstrap.start();
        const context = fw.getBundleContext();

        // Register some test services
        context.registerService('LogService', {
          log: (level: number, message: string) => console.log(`[${level}] ${message}`),
          setLogLevel: (level: number) => console.log(`Log level set to: ${level}`),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Logging service for the framework',
        });

        context.registerService('ConfigurationAdmin', {
          getConfiguration: (pid: string) => ({ pid, properties: {} }),
          listConfigurations: () => Promise.resolve([]),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Configuration management service',
        });

        context.registerService('EventAdmin', {
          postEvent: (event: any) => console.log('Event posted:', event),
          sendEvent: (event: any) => console.log('Event sent:', event),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Event distribution service',
          'service.ranking': 100,
        });

        if (mounted) {
          setFramework(fw);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize framework:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initFramework();

    return () => {
      mounted = false;
    };
  }, []);

  async function installTestBundle() {
    if (!framework) return;

    const context = framework.getBundleContext();

    try {
      const bundle = await context.installBundle('test://com.example.test.bundle', {
        headers: {
          bundleSymbolicName: 'com.example.test.bundle',
          bundleVersion: '2.0.0',
          bundleName: 'Test Bundle',
          bundleDescription: 'A test bundle for demonstration',
        },
        activator: {
          start: async (ctx) => {
            console.log('Test bundle started');
            ctx.registerService('TestService', {
              doSomething: () => 'Test service working!',
              getName: () => 'Test Service Implementation',
            }, {
              'service.description': 'A test service',
              'service.vendor': 'Demo',
              'test.property': 'example-value',
            });
          },
          stop: async () => {
            console.log('Test bundle stopped');
          },
        },
      });

      await bundle.start();
    } catch (error) {
      console.error('Failed to install bundle:', error);
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <h1>Loading Pandino Framework...</h1>
      </div>
    );
  }

  if (!framework) {
    return (
      <div style={styles.error}>
        <h1>Failed to load framework</h1>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <PandinoVisualizerProvider>
        <PandinoVisualizer framework={framework} defaultOpen={true} position="fullscreen">
          <span style={styles.controlsSeparator}>|</span>
          <span style={styles.controlsLabel}>🎮 Demo:</span>
          <button onClick={installTestBundle} style={styles.controlButton}>
            📦 Install Bundle
          </button>
          <button onClick={() => {
            const context = framework.getBundleContext();
            context.registerService('DynamicService', {
              test: () => 'Dynamic service',
            }, {
              'service.description': 'Dynamically registered service',
              'timestamp': Date.now(),
            });
          }} style={styles.controlButton}>
            ⚙️ Register Service
          </button>
          <span style={styles.controlHint}>
            <code style={styles.code}>Ctrl+Shift+V</code> to toggle
          </span>
        </PandinoVisualizer>
      </PandinoVisualizerProvider>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
  },
  controlsSeparator: {
    color: 'rgba(255, 255, 255, 0.2)',
    margin: '0 8px',
    fontSize: '18px',
  },
  controlsLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0078d4',
    marginRight: '8px',
  },
  controlButton: {
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    border: 'none',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 6px rgba(0, 120, 212, 0.3)',
    whiteSpace: 'nowrap',
  },
  controlHint: {
    fontSize: '11px',
    color: '#a0a0a0',
    marginLeft: '12px',
    paddingLeft: '12px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  },
  code: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '2px 4px',
    borderRadius: '3px',
    fontSize: '10px',
    fontFamily: 'monospace',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#1e1e1e',
    color: 'white',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#1e1e1e',
    color: '#f44336',
  },
};

const root = createRoot(document.getElementById('root')!);
root.render(<Demo />);

