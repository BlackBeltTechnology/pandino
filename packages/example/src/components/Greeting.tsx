import { type FC, useState } from 'react';
import { useService } from '@pandino/react-hooks';
import type { GreetingService } from '../bundles/greeting-service-bundle';
import './Greeting.css';

interface GreetingProps {
  name: string;
}

const Greeting: FC<GreetingProps> = ({ name }) => {
  const { service: greetingService, loading } = useService<GreetingService>('GreetingService');
  const [useRandomGreeting, setUseRandomGreeting] = useState(false);

  if (loading || !greetingService) {
    return (
      <div className="greeting-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading greeting service...</p>
      </div>
    );
  }

  const currentGreeting = useRandomGreeting ? greetingService.getRandomGreeting(name) : greetingService.greet(name);

  return (
    <div className="greeting-container">
      <div className="greeting-message">
        <h2 className="greeting-title">{currentGreeting}</h2>
        <p className="greeting-subtitle">{greetingService.getWelcomeMessage()}</p>

        <div className="greeting-controls">
          <button
            className={`greeting-button ${useRandomGreeting ? 'active' : ''}`}
            onClick={() => setUseRandomGreeting(!useRandomGreeting)}
          >
            {useRandomGreeting ? '🎲 Random Mode ON' : '🎯 Standard Mode'}
          </button>

          {useRandomGreeting && (
            <button
              className="greeting-button secondary"
              onClick={() => {
                // Force re-render to get new random greeting
                setUseRandomGreeting(false);
                setTimeout(() => setUseRandomGreeting(true), 50);
              }}
            >
              🔄 New Random Greeting
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Greeting;
