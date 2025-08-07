import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Service Registry',
    emoji: '🔌',
    description: (
      <>
        Services discover each other dynamically, eliminating hard-coded dependencies between modules.
      </>
    ),
  },
  {
    title: 'Bundle System',
    emoji: '📦',
    description: (
      <>
        Modular containers with independent lifecycles replace monolithic application architecture.
      </>
    ),
  },
  {
    title: 'Dynamic Dependencies',
    emoji: '🔄',
    description: (
      <>
        Bundles start in any order, and dependencies resolve automatically without startup order dependencies.
      </>
    ),
  },
  {
    title: 'Event System',
    emoji: '📡',
    description: (
      <>
        Publish-subscribe messaging with topic-based routing eliminates tight coupling between modules.
      </>
    ),
  },
  {
    title: 'Configuration Management',
    emoji: '⚙️',
    description: (
      <>
        Runtime configuration updates without restarts replace static application configuration.
      </>
    ),
  },
  {
    title: 'Declarative Services',
    emoji: '🏗️',
    description: (
      <>
        Decorator-based dependency injection simplifies complex service wiring boilerplate.
      </>
    ),
  },
  {
    title: 'React Integration',
    emoji: '⚛️',
    description: (
      <>
        Hook-based service discovery in components reduces framework complexity in React apps.
      </>
    ),
  },
];

function Feature({emoji, title, description}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center">
        <div className={styles.featureEmoji}>{emoji}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.featuresTitle}>Key Features</h2>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
