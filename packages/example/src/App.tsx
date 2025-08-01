import { useState } from 'react';
import { useService } from '@pandino/react-hooks';
import { usePandinoContext } from '@pandino/react-hooks';
import './App.css';
import Greeting from './components/Greeting';
import BundleInfo from './components/BundleInfo';
import type { GreetingService } from './bundles/greeting-service-bundle';

function App() {
  const [name, setName] = useState('Pandino User');
  const { bundleContext } = usePandinoContext();
  const { service: greetingService } = useService<GreetingService>('GreetingService');

  return (
    <div className="app">
      <div className="hero-section">
        <h1 className="app-title">
          <span className="gradient-text">Pandino</span>
          <span className="subtitle">Dynamic Service Example</span>
        </h1>
        <p className="app-description">Experience dynamic service component runtime with elegant React integration</p>
      </div>

      <div className="main-content">
        <div className="status-card">
          <div className="status-indicator">
            <div className={`status-dot ${bundleContext ? 'connected' : 'disconnected'}`}></div>
            <span className="status-text">Framework: {bundleContext ? 'Connected' : 'Initializing...'}</span>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${greetingService ? 'connected' : 'disconnected'}`}></div>
            <span className="status-text">Greeting Service: {greetingService ? 'Available' : 'Loading...'}</span>
          </div>
        </div>

        <div className="card">
          <Greeting name={name} />

          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Your name:
            </label>
            <div className="input-wrapper">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="styled-input"
              />
              <div className="input-focus-ring"></div>
            </div>
          </div>

          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">🚀</div>
              <h3>Dynamic Loading</h3>
              <p>Services loaded at runtime via bundle system</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3>React Hooks</h3>
              <p>Seamless integration with React components</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔧</div>
              <h3>Service Registry</h3>
              <p>Modular service-oriented architecture</p>
            </div>
          </div>
        </div>
      </div>

      <BundleInfo />
    </div>
  );
}

export default App;
