import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';

export interface GreetingService {
  greet(name: string): string;
  getRandomGreeting(name: string): string;
  getServiceType(): string;
}

class StandardGreetingService implements GreetingService {
  private greetings = [
    'Hello, {name}! Welcome to Pandino! ✨',
    'Greetings, {name}! Service Registry at work! 🚀',
    'Hey there, {name}! Dynamic services in action! 🎉',
  ];

  greet(name: string): string {
    return `Hello, ${name}! Welcome to Pandino!`;
  }

  getRandomGreeting(name: string): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    return this.greetings[randomIndex].replace('{name}', name);
  }

  getServiceType(): string {
    return 'standard';
  }
}

class FormalGreetingService implements GreetingService {
  private greetings = [
    'Good day, {name}. Welcome to the Pandino framework.',
    'Greetings and salutations, {name}. The Service Registry is at your service.',
    'Welcome, {name}. We are pleased to demonstrate dynamic services.',
  ];

  greet(name: string): string {
    return `Good day, ${name}. Welcome to the Pandino framework.`;
  }

  getRandomGreeting(name: string): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    return this.greetings[randomIndex].replace('{name}', name);
  }

  getServiceType(): string {
    return 'formal';
  }
}

class CasualGreetingService implements GreetingService {
  private greetings = [
    "Hey {name}! What's up? Welcome to Pandino! 😎",
    'Yo {name}! Service Registry doing its thing! 🔥',
    'Sup {name}! Check out these dynamic services! 👍',
  ];

  greet(name: string): string {
    return `Hey ${name}! What's up? Welcome to Pandino! 😎`;
  }

  getRandomGreeting(name: string): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    return this.greetings[randomIndex].replace('{name}', name);
  }

  getServiceType(): string {
    return 'casual';
  }
}

class GreetingServiceActivator implements BundleActivator {
  private standardRegistration: ServiceRegistration<GreetingService> | null = null;
  private formalRegistration: ServiceRegistration<GreetingService> | null = null;
  private casualRegistration: ServiceRegistration<GreetingService> | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Greeting Service Bundle');
    }

    const standardService = new StandardGreetingService();
    this.standardRegistration = context.registerService<GreetingService>('GreetingService', standardService, {
      'greeting.type': 'standard',
      'greeting.style': 'friendly',
      'service.ranking': 100, // Medium priority
      'service.description': 'Standard greeting service with friendly messages',
    });

    const formalService = new FormalGreetingService();
    this.formalRegistration = context.registerService<GreetingService>('GreetingService', formalService, {
      'greeting.type': 'formal',
      'greeting.style': 'professional',
      'service.ranking': 50, // Lower priority
      'service.description': 'Formal greeting service with professional messages',
    });

    const casualService = new CasualGreetingService();
    this.casualRegistration = context.registerService<GreetingService>('GreetingService', casualService, {
      'greeting.type': 'casual',
      'greeting.style': 'informal',
      'service.ranking': 150, // Higher priority
      'service.description': 'Casual greeting service with informal messages',
    });

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Greeting Service Bundle started');
    }
  }

  async stop(): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Greeting Service Bundle');
    }

    if (this.standardRegistration) {
      this.standardRegistration.unregister();
      this.standardRegistration = null;
    }

    if (this.formalRegistration) {
      this.formalRegistration.unregister();
      this.formalRegistration = null;
    }

    if (this.casualRegistration) {
      this.casualRegistration.unregister();
      this.casualRegistration = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Greeting Service Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/greeting-service',
    bundleVersion: '1.0.0',
    bundleName: 'Greeting Service Bundle',
  },
  activator: new GreetingServiceActivator(),
};
