export interface ClaimInfo {
  type: 'EMAIL' | 'USERNAME' | undefined,
  attributeName: string,
}

export interface Authentication {
  realm: string,
  claims?: ClaimInfo[],
}

export interface Actor {
  name: string
  authentication?: Authentication,
}

export interface Menu {
  label: string,
  route: string,
}

export interface Component {
  type: string,
  props?: any,
  children?: Component[],
}

export interface Page extends Component {
}

export interface AppMeta {
  appName: string,
  actor: Actor,
  menu: Menu[],
  pages: Page[],
}
