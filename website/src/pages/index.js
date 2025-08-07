import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          A lightweight TypeScript framework that brings <strong>modular architecture</strong> to your applications.
          Build loosely-coupled, maintainable applications where different parts can communicate without knowing about each other directly.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--success button--lg"
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--outline button--success button--lg"
            href="https://github.com/pandino/pandino">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="OSGi-Style Framework for TypeScript - Build modular, maintainable applications with dynamic service discovery">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <section className={styles.comparison}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Why Choose Pandino?</h2>
            <p className={styles.sectionSubtitle}>See how Pandino's dynamic approach revolutionizes dependency management</p>
            <div className={styles.vsComparison}>
              <div className={styles.vsLeft}>
                <div className={styles.vsHeader}>
                  <h3>Traditional DI</h3>
                  <div className={styles.vsIcon}>🔒</div>
                </div>
                <div className={styles.vsItem}>
                  <div className={styles.vsItemIcon}>❌</div>
                  <div className={styles.vsItemContent}>
                    <h4>Static Injection</h4>
                    <p>Dependencies are hard-coded at compile time, requiring rebuilds for changes</p>
                  </div>
                </div>
                <div className={styles.vsItem}>
                  <div className={styles.vsItemIcon}>❌</div>
                  <div className={styles.vsItemContent}>
                    <h4>Fixed Wiring</h4>
                    <p>Service relationships are determined during build, not at runtime</p>
                  </div>
                </div>
                <div className={styles.vsItem}>
                  <div className={styles.vsItemIcon}>❌</div>
                  <div className={styles.vsItemContent}>
                    <h4>Single Implementation</h4>
                    <p>Only one service can fulfill an interface, limiting flexibility</p>
                  </div>
                </div>
              </div>

              <div className={styles.vsDivider}>
                <div className={styles.vsDividerLine}></div>
                <div className={styles.vsDividerText}>VS</div>
                <div className={styles.vsDividerLine}></div>
              </div>

              <div className={styles.vsRight}>
                <div className={styles.vsHeader}>
                  <h3>Pandino Registry</h3>
                  <div className={styles.vsIcon}>🚀</div>
                </div>
                <div className={styles.vsItem}>
                  <div className={styles.vsItemIcon}>✅</div>
                  <div className={styles.vsItemContent}>
                    <h4>Dynamic Discovery</h4>
                    <p>Services find each other at runtime, adapting to system changes automatically</p>
                  </div>
                </div>
                <div className={styles.vsItem}>
                  <div className={styles.vsItemIcon}>✅</div>
                  <div className={styles.vsItemContent}>
                    <h4>Filtered Selection</h4>
                    <p>LDAP filters let you select exactly the service implementation you need</p>
                  </div>
                </div>
                <div className={styles.vsItem}>
                  <div className={styles.vsItemIcon}>✅</div>
                  <div className={styles.vsItemContent}>
                    <h4>Multiple Services</h4>
                    <p>Rank and select from multiple implementations of the same interface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.useCases}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Unlock New Possibilities</h2>
            <p className={styles.sectionSubtitle}>See how Pandino transforms common architectural challenges</p>

            <div className={styles.useCaseHub}>
              <div className={styles.useCaseCenter}>
                <div className={styles.useCaseCenterIcon}>
                  <span>🔌</span>
                </div>
                <h3>Dynamic Service Registry</h3>
                <p>The core of Pandino's power - connect any service to any other without direct dependencies</p>
              </div>

              <div className={styles.useCaseConnectors}>
                <div className={styles.connector} id={styles.connector1}></div>
                <div className={styles.connector} id={styles.connector2}></div>
                <div className={styles.connector} id={styles.connector3}></div>
                <div className={styles.connector} id={styles.connector4}></div>
              </div>

              <div className={styles.useCaseSatellites}>
                <div className={styles.useCaseSatellite} id={styles.satellite1}>
                  <div className={styles.satelliteContent}>
                    <div className={styles.satelliteIcon}>🚀</div>
                    <h4>Microservices</h4>
                    <p>Dynamic service discovery makes your system resilient to changes</p>
                  </div>
                </div>

                <div className={styles.useCaseSatellite} id={styles.satellite2}>
                  <div className={styles.satelliteContent}>
                    <div className={styles.satelliteIcon}>🧩</div>
                    <h4>Plugin Systems</h4>
                    <p>Hot-swap components while your application is running</p>
                  </div>
                </div>

                <div className={styles.useCaseSatellite} id={styles.satellite3}>
                  <div className={styles.satelliteContent}>
                    <div className={styles.satelliteIcon}>🚦</div>
                    <h4>Feature Flags</h4>
                    <p>Toggle features at the service level, not in your code</p>
                  </div>
                </div>

                <div className={styles.useCaseSatellite} id={styles.satellite4}>
                  <div className={styles.satelliteContent}>
                    <div className={styles.satelliteIcon}>🏢</div>
                    <h4>Multi-tenant Apps</h4>
                    <p>Route to tenant-specific services automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.getStarted}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Your Journey Starts Here</h2>
            <p className={styles.sectionSubtitle}>Follow these steps to build your first modular application</p>

            <div className={styles.journeyPath}>
              <div className={styles.journeyStep} id={styles.step1}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Install the Framework</h3>
                  <p>Start with the core package that provides the foundation for your modular architecture</p>
                  <div className={styles.codeBlock}>
                    <code>npm install @pandino/pandino</code>
                  </div>
                  <div className={styles.stepNote}>
                    <span>⏱️ Time:</span> 2 minutes
                  </div>
                </div>
              </div>

              <div className={styles.journeyStep} id={styles.step2}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Create Your First Service</h3>
                  <p>Define a service interface and implementation using the declarative API</p>
                  <div className={styles.stepNote}>
                    <span>⏱️ Time:</span> 5 minutes
                  </div>
                  <Link
                    className="button button--outline button--primary"
                    to="/docs/quick-start">
                    Quick Start Guide
                  </Link>
                </div>
              </div>

              <div className={styles.journeyStep} id={styles.step3}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Connect Your Services</h3>
                  <p>Use service references to dynamically discover and connect to other services</p>
                  <div className={styles.stepNote}>
                    <span>⏱️ Time:</span> 10 minutes
                  </div>
                  <Link
                    className="button button--outline button--primary"
                    to="/docs/core-concepts/service-registry">
                    Service Registry Guide
                  </Link>
                </div>
              </div>

              <div className={styles.journeyStep} id={styles.step4}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3>Build Your Application</h3>
                  <p>Assemble your services into a complete application with dynamic wiring</p>
                  <div className={styles.stepHighlight}>
                    <div className={styles.highlightIcon}>🚀</div>
                    <div className={styles.highlightContent}>
                      <h4>Ready to go further?</h4>
                      <p>Explore our integrations for React, Vue, or Angular to supercharge your frontend applications</p>
                      <Link
                        className="button button--success"
                        to="/docs/packages/react-hooks">
                        Explore Integrations
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
