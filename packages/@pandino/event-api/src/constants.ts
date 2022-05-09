/**
 * Service registration property specifying the Event topics of interest to an Event Handler service.
 *
 * Event handlers SHOULD be registered with this property. Each value of this property is a string that describe the
 * topics in which the handler is interested. An asterisk ('*') may be used as a trailing wildcard.
 */
export const EVENT_TOPIC = 'event.topics';

/**
 * Service Registration property specifying a filter to further select Event s of interest to an Event Handler service.
 *
 * Event handlers MAY be registered with this property. The value of this property is a string containing an LDAP-style
 * filter specification. Any of the event's properties may be used in the filter expression. Each event handler is
 * notified for any event which belongs to the topics in which the handler has expressed an interest. If the event
 * handler is also registered with this service property, then the properties of the event must also match the filter
 * for the event to be delivered to the event handler.
 */
export const EVENT_FILTER = 'event.filter';

/**
 * Service Registration property specifying the delivery qualities requested by an Event Handler service.
 *
 * Event handlers MAY be registered with this property. Each value of this property is a string specifying a delivery
 * quality for the Event handler.
 */
export const EVENT_DELIVERY = 'event.delivery';

/**
 * The Bundle Symbolic Name of the bundle relevant to the event. The type of the value for this event property is
 * {@code string}.
 */
export const BUNDLE_SYMBOLICNAME = 'bundle.symbolicName';

/**
 * The Bundle id of the bundle relevant to the event. The type of the value for this event property is {@code number}.
 */
export const BUNDLE_ID = 'bundle.id';

/**
 * The Bundle object of the bundle relevant to the event. The type of the value for this event property is
 * ${@code Bundle}
 */
export const BUNDLE = 'bundle';

/**
 * The version of the bundle relevant to the event. The type of the value for this event property is {@SemVer}.
 */
export const BUNDLE_VERSION = 'bundle.version';

/**
 * The forwarded event object. Used when rebroadcasting an event that was sent via some other event mechanism. The type
 * of the value for this event property is {@code Event}
 */
export const EVENT = 'event';

/**
 * A human-readable message that is usually not localized. The type of the value for this event property is
 * {@code string}
 */
export const MESSAGE = 'message';

/**
 * A service reference. The type of the value for this event property is {@code ServiceReference<any>}.
 */
export const SERVICE = 'service';

/**
 * A service's id. The type of the value for this event property is {@code number}
 */
export const SERVICE_ID = 'service.id';

/**
 * A service's objectClass. The type of the value for this event property is {@code string[]}
 */
export const SERVICE_OBJECTCLASS = 'service.objectClass';

/**
 * A service's persistent identity. The type of the value for this event property is {@code string} or {@code string[]}
 */
export const SERVICE_PID = 'service.pid';

/**
 * The time when the event occurred, as reported by "new Date()". The type of the value for this event property is
 * {@code string}, the ISO 8601 compliant serialized form of the current date-time.
 */
export const TIMESTAMP = 'timestamp';

/**
 * The name of the implementation capability for the Event Admin specification.
 */
export const EVENT_ADMIN_IMPLEMENTATION = 'pandino.event';

export const EVENT_HANDLER_INTERFACE_KEY = '@pandino/event-admin/EventHandler';

export const EVENT_ADMIN_INTERFACE_KEY = '@pandino/event-admin/EventAdmin';

export const BUNDLE_EVENT_INTERFACE_KEY = '@pandino/event-admin/BundleEvent';

export const FRAMEWORK_EVENT_INTERFACE_KEY = '@pandino/event-admin/FrameworkEvent';

export const LOG_EVENT_INTERFACE_KEY = '@pandino/event-admin/LogEvent';

export const SERVICE_EVENT_INTERFACE_KEY = '@pandino/event-admin/ServiceEvent';

export const EVENT_FACTORY_INTERFACE_KEY = '@pandino/event-admin/EventFactory';
