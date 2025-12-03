import { memo } from 'react';
import type { OSGiFramework, ServiceEvent, BundleEvent } from '@pandino/pandino';
import { BUNDLE_STATES, SERVICE_EVENT_TYPES } from '@pandino/pandino';

interface FrameworkEvent {
  type: 'service' | 'bundle';
  event: ServiceEvent | BundleEvent;
  timestamp: number;
}

export interface EventLogProps {
  events: FrameworkEvent[];
  framework: OSGiFramework;
}

export const EventLog = memo(({ events, framework }: EventLogProps) => {
  const context = framework.getBundleContext();
  const bundles = context.getBundles();

  return (
    <div className="pandino-event-log">
      <div className="event-log-header">
        <h3>Framework Activity</h3>
        <span className="event-count">{events.length} events</span>
      </div>

      <div className="bundle-list">
        <h3>Bundles</h3>
        {bundles.map(bundle => {
          const state = getStateName(bundle.getState());
          const services = bundle.getRegisteredServices();

          return (
            <div key={bundle.getBundleId()} className="bundle-list-item">
              <div className="bundle-list-header">
                <span className="bundle-id">#{bundle.getBundleId()}</span>
                <span className="bundle-name">{bundle.getSymbolicName()}</span>
                <span className={`bundle-state state-${state.toLowerCase()}`}>{state}</span>
              </div>
              <div className="bundle-list-details">
                <div>Version: {bundle.getVersion()}</div>
                <div>Services: {services.length}</div>
                {services.length > 0 && (
                  <div className="service-list">
                    {services.map(service => {
                      const objectClass = service.getProperty('objectClass');
                      const serviceName = Array.isArray(objectClass) ? objectClass[0] : objectClass;
                      const serviceId = service.getProperty('service.id');

                      // Check if this is a DS component
                      const componentName = service.getProperty('component.name');
                      const componentId = service.getProperty('component.id');
                      const isComponent = !!(componentName || componentId);
                      const factory = service.getProperty('component.factory');
                      const immediate = service.getProperty('component.immediate');
                      const configPolicy = service.getProperty('component.configuration.policy');
                      const configPid = service.getProperty('component.configuration.pid');

                      // Extract references
                      const references: any[] = [];
                      if (isComponent) {
                        const refKeys = Object.keys(service.getProperties()).filter(k => k.startsWith('component.reference.') && !k.includes('.interface') && !k.includes('.cardinality') && !k.includes('.policy') && !k.includes('.target'));
                        refKeys.forEach(key => {
                          const refName = key.replace('component.reference.', '');
                          const refInterface = service.getProperty(`${key}.interface`);
                          const cardinality = service.getProperty(`${key}.cardinality`);
                          const policy = service.getProperty(`${key}.policy`);
                          references.push({
                            name: refName,
                            interface: refInterface,
                            cardinality: cardinality || '1..1',
                            policy: policy || 'static',
                          });
                        });
                      }

                      return (
                        <div key={serviceId} className={`service-list-item ${isComponent ? 'ds-component-item' : ''}`}>
                          <div className="service-item-header">
                            <span className="service-icon">{isComponent ? '🔷' : '⚙️'}</span>
                            <span className="service-name">{serviceName}</span>
                            <span className="service-id">#{serviceId}</span>
                          </div>

                          {isComponent && (
                            <div className="component-metadata">
                              <div className="component-badges">
                                <span className="badge badge-component">DS Component</span>
                                {factory && <span className="badge badge-factory">Factory</span>}
                                {immediate && <span className="badge badge-immediate">Immediate</span>}
                              </div>

                              {componentName && (
                                <div className="metadata-row">
                                  <span className="metadata-label">Component:</span>
                                  <span className="metadata-value">{componentName}</span>
                                </div>
                              )}

                              {configPolicy && (
                                <div className="metadata-row">
                                  <span className="metadata-label">Config Policy:</span>
                                  <span className="metadata-value">{configPolicy}</span>
                                  {configPid && (
                                    <span className="metadata-pid">({configPid})</span>
                                  )}
                                </div>
                              )}

                              {references.length > 0 && (
                                <div className="references-section">
                                  <div className="metadata-label">References:</div>
                                  <div className="references-list">
                                    {references.map((ref, idx) => (
                                      <div key={idx} className="reference-row">
                                        <span className="reference-name">{ref.name}</span>
                                        <span className="reference-details">
                                          [{ref.cardinality}] {ref.interface} ({ref.policy})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="event-timeline">
        <h3>Recent Events</h3>
        {events.length === 0 ? (
          <div className="no-events">No events yet</div>
        ) : (
          events.map((log, index) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();

            if (log.type === 'service') {
              const event = log.event as ServiceEvent;
              const eventType = getServiceEventTypeName(event.getType());
              const serviceRef = event.getServiceReference();
              const objectClass = serviceRef.getProperty('objectClass');
              const serviceName = Array.isArray(objectClass) ? objectClass[0] : objectClass;
              const serviceId = serviceRef.getProperty('service.id');

              return (
                <div key={index} className="event-item event-service">
                  <div className="event-time">{timeStr}</div>
                  <div className="event-type">{eventType}</div>
                  <div className="event-details">
                    {serviceName} <span className="event-id">(#{serviceId})</span>
                  </div>
                </div>
              );
            } else {
              const event = log.event as BundleEvent;
              const eventType = getStateName(event.getType());
              const bundle = event.getBundle();

              return (
                <div key={index} className="event-item event-bundle">
                  <div className="event-time">{timeStr}</div>
                  <div className="event-type">{eventType}</div>
                  <div className="event-details">
                    {bundle.getSymbolicName()} <span className="event-id">(#{bundle.getBundleId()})</span>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
});

EventLog.displayName = 'EventLog';

function getStateName(state: number): string {
  for (const [name, value] of Object.entries(BUNDLE_STATES)) {
    if (value === state) return name;
  }
  return 'UNKNOWN';
}

function getServiceEventTypeName(type: number): string {
  for (const [name, value] of Object.entries(SERVICE_EVENT_TYPES)) {
    if (value === type) return name;
  }
  return 'UNKNOWN';
}

