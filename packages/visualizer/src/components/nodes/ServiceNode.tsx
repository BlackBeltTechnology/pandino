import { memo, useState, createElement } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { ServiceReference } from '@pandino/pandino';

export interface ServiceNodeData {
  serviceRef: ServiceReference<any>;
  label: string;
  id: number;
  ranking: number;
  properties: Record<string, any>;
  interfaces: string[];
  dsMetadata?: {
    isComponent: boolean;
    componentName?: string;
    componentId?: number;

    // Component properties
    properties?: Record<string, any>;

    // Service registration
    service?: {
      interfaces?: string[];
      scope?: 'singleton' | 'bundle' | 'prototype';
    };

    // Lifecycle methods
    activate?: string;
    deactivate?: string;
    modified?: string;

    // Configuration
    configurationPid?: string;
    configurationPolicy?: 'optional' | 'require' | 'ignore';

    // Factory support
    factory?: string;

    // Component behavior
    immediate?: boolean;
    enabled?: boolean;
    scope?: 'singleton' | 'bundle' | 'prototype';

    // References
    references?: Array<{
      name: string;
      interface: string;
      cardinality: '1..1' | '0..1' | '1..n' | '0..n';
      policy: 'static' | 'dynamic';
      policyOption?: 'reluctant' | 'greedy';
      target?: string;
      bind?: string;
      unbind?: string;
      updated?: string;
      field?: string;
      fieldOption?: 'replace' | 'update';
      scope?: 'bundle' | 'prototype' | 'prototype_required';
    }>;
  } | null;
}

export const ServiceNode = memo(({ data }: NodeProps) => {
  const { label, id, ranking, properties, interfaces, dsMetadata } = data as unknown as ServiceNodeData;
  const [expanded, setExpanded] = useState(false);

  const isComponent = dsMetadata?.isComponent || false;
  const isMissing = (data as any).isMissing || false;
  const hasIssues = (data as any).hasIssues || false;

  // Consumer-only component: @Component without @Service
  const isConsumerOnly = isComponent && (!dsMetadata?.service || dsMetadata.service.interfaces?.length === 0);

  if (isMissing) {
    // Render missing service placeholder
    return (
      <div className="custom-node service-node node-missing">
        {createElement(Handle as any, { type: 'target', position: Position.Top })}

        <div className="node-header">
          <div className="node-icon">⚠️</div>
          <div className="node-title" style={{ color: '#d32f2f', fontStyle: 'italic' }}>
            {label}
          </div>
        </div>

        <div className="node-body">
          <div className="node-field">
            <span className="node-badge" style={{ background: '#f44336', color: 'white' }}>
              MISSING SERVICE
            </span>
          </div>
          <div className="node-field" style={{ fontSize: '10px', color: '#d32f2f' }}>
            No service provides this interface
          </div>
        </div>

        {createElement(Handle as any, { type: 'source', position: Position.Bottom })}
      </div>
    );
  }

  return (
    <div className={`custom-node service-node ${isComponent ? 'ds-component' : ''} ${isConsumerOnly ? 'consumer-only' : ''} ${hasIssues ? 'node-has-issues' : ''}`}>
      {createElement(Handle as any, { type: 'target', position: Position.Top })}

      <div className="node-header" onClick={() => setExpanded(!expanded)}>
        <div className="node-icon">{isConsumerOnly ? '🔹' : isComponent ? '🔷' : '⚙️'}</div>
        <div className="node-title">{label}</div>
        <button className="node-expand">{expanded ? '▼' : '▶'}</button>
      </div>

      <div className="node-body">
        <div className="node-field">
          <span className="node-label">ID:</span>
          <span className="node-value">{id}</span>
        </div>
        <div className="node-field">
          <span className="node-label">Ranking:</span>
          <span className="node-value">{ranking}</span>
        </div>

        {isComponent && dsMetadata && (
          <>
            <div className="node-field">
              {isConsumerOnly ? (
                <span className="node-badge badge-consumer-only">Consumer Component</span>
              ) : (
                <span className="node-badge badge-component">DS Component</span>
              )}
            </div>
            {dsMetadata.componentName && (
              <div className="node-field">
                <span className="node-label">Component:</span>
                <span className="node-value">{dsMetadata.componentName}</span>
              </div>
            )}
            {dsMetadata.factory && (
              <div className="node-field">
                <span className="node-badge badge-factory">Factory: {dsMetadata.factory}</span>
              </div>
            )}
            {dsMetadata.immediate && (
              <div className="node-field">
                <span className="node-badge badge-immediate">Immediate</span>
              </div>
            )}
            {dsMetadata.enabled === false && (
              <div className="node-field">
                <span className="node-badge badge-disabled">Disabled</span>
              </div>
            )}
            {dsMetadata.scope && (
              <div className="node-field">
                <span className="node-label">Scope:</span>
                <span className="node-value">{dsMetadata.scope}</span>
              </div>
            )}
            {dsMetadata.service?.scope && (
              <div className="node-field">
                <span className="node-label">Service Scope:</span>
                <span className="node-value">{dsMetadata.service.scope}</span>
              </div>
            )}
            {dsMetadata.configurationPolicy && (
              <div className="node-field">
                <span className="node-label">Config Policy:</span>
                <span className="node-value">{dsMetadata.configurationPolicy}</span>
              </div>
            )}
            {dsMetadata.configurationPid && (
              <div className="node-field">
                <span className="node-label">Config PID:</span>
                <span className="node-value" style={{ fontSize: '10px' }}>{dsMetadata.configurationPid}</span>
              </div>
            )}
            {(dsMetadata.activate || dsMetadata.deactivate || dsMetadata.modified) && (
              <div className="node-field">
                <span className="node-label">Lifecycle:</span>
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  {dsMetadata.activate && <div>▶ activate: {dsMetadata.activate}()</div>}
                  {dsMetadata.deactivate && <div>⏹ deactivate: {dsMetadata.deactivate}()</div>}
                  {dsMetadata.modified && <div>🔄 modified: {dsMetadata.modified}()</div>}
                </div>
              </div>
            )}
          </>
        )}

        {interfaces.length > 1 && (
          <div className="node-field">
            <span className="node-label">Interfaces:</span>
            <div className="node-interfaces">
              {interfaces.slice(1).map((iface: string, idx: number) => (
                <span key={idx} className="interface-badge">{iface}</span>
              ))}
            </div>
          </div>
        )}

        {expanded && (
          <>
            {isComponent && dsMetadata?.references && dsMetadata.references.length > 0 && (
              <div className="node-references">
                <div className="node-label">References:</div>
                {dsMetadata.references.map((ref, idx) => (
                  <div key={idx} className="reference-item">
                    <div className="reference-name">
                      {ref.name}
                      {ref.cardinality && (
                        <span className="reference-cardinality">[{ref.cardinality}]</span>
                      )}
                    </div>
                    <div className="reference-interface">{ref.interface}</div>
                    {ref.policy && (
                      <div className="reference-policy">
                        Policy: {ref.policy}
                        {ref.policyOption && ` (${ref.policyOption})`}
                      </div>
                    )}
                    {ref.target && (
                      <div className="reference-target">Target: {ref.target}</div>
                    )}
                    {ref.field && (
                      <div className="reference-field">Field: {ref.field}</div>
                    )}
                    {ref.bind && (
                      <div className="reference-method">Bind: {ref.bind}()</div>
                    )}
                    {ref.unbind && (
                      <div className="reference-method">Unbind: {ref.unbind}()</div>
                    )}
                    {ref.updated && (
                      <div className="reference-method">Updated: {ref.updated}()</div>
                    )}
                    {ref.scope && (
                      <div className="reference-scope">Scope: {ref.scope}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="node-properties">
              <div className="node-label">Properties:</div>
              {Object.entries(properties)
                .filter(([key]) => !['service.id', 'objectClass', 'service.ranking', 'service.scope', 'component.name', 'component.id', 'component.factory', 'component.immediate', 'component.enabled', 'component.scope', 'component.activate', 'component.deactivate', 'component.modified', 'component.configuration.policy', 'component.configuration.pid'].includes(key))
                .filter(([key]) => !key.startsWith('component.reference.'))
                .map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span className="property-key">{key}:</span>
                    <span className="property-value">{JSON.stringify(value)}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {createElement(Handle as any, { type: 'source', position: Position.Bottom })}
    </div>
  );
});

ServiceNode.displayName = 'ServiceNode';

