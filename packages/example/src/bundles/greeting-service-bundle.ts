import { Component, Service, Activate, Deactivate, ServiceComponentRuntime, ServiceReference } from '@pandino/pandino';
import type { ComponentContext, BundleActivator, BundleContext } from '@pandino/pandino';

export interface GreetingService {
  greet(name: string): string;
  getWelcomeMessage(): string;
  getRandomGreeting(name: string): string;
}

@Component({
  name: 'greeting.service',
  immediate: true,
})
@Service({
  interfaces: ['GreetingService'],
})
export class GreetingServiceComponent implements GreetingService {
  private greetings = [
    'Hello, {name}! Welcome to the enhanced Pandino experience! ✨',
    "Greetings, {name}! You're using dynamic SCR services! 🚀",
    'Hey there, {name}! This service was loaded dynamically! 🎉',
    'Welcome, {name}! SCR components are now running seamlessly! 💫',
  ];

  @Activate
  activate(_context: ComponentContext): void {
    console.log('GreetingService component activated');
  }

  @Deactivate
  deactivate(_context: ComponentContext): void {
    console.log('GreetingService component deactivated');
  }

  greet(name: string): string {
    return `Hello, ${name}! Welcome to Pandino!`;
  }

  getWelcomeMessage(): string {
    return 'Welcome to the Pandino framework! 🎯';
  }

  getRandomGreeting(name: string): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    const template = this.greetings[randomIndex];
    return template.replace('{name}', name);
  }
}

export class GreetingServiceBundleActivator implements BundleActivator {
  private scrRef: ServiceReference<ServiceComponentRuntime> | null = null;
  async start(context: BundleContext): Promise<void> {
    console.log('Greeting Service Bundle started');
    this.scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!;
    const scr = context.getService(this.scrRef)!;

    scr.registerComponent(GreetingServiceComponent);
  }

  async stop(context: BundleContext): Promise<void> {
    console.log('Greeting Service Bundle stopped');
    if (this.scrRef) {
      context.ungetService(this.scrRef);
      this.scrRef = null;
    }
  }
}

// Export bundle with proper activator
export default {
  headers: {
    bundleSymbolicName: import.meta.env.VITE_BUNDLE_SYMBOLIC_NAME,
    bundleVersion: import.meta.env.VITE_BUNDLE_VERSION,
    bundleName: 'Greeting Service SCR Bundle',
    bundleDescription: import.meta.env.VITE_BUNDLE_DESCRIPTION,
  },
  activator: new GreetingServiceBundleActivator(),
};
