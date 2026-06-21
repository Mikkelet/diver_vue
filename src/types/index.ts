export interface Organization {
  id: string
  name: string
  slug: string
}

export interface Environment {
  name: string
  scheme: string
}

export interface App {
  id: string
  name: string
  slug: string
  organizationId: string
  deeplinksCount: number
  environments: Environment[]
}

export type QueryParamType = 'string' | 'boolean' | 'list'

export interface QueryParam {
  type: QueryParamType
  /** Whether the caller must supply this parameter for the deeplink to resolve. */
  required: boolean
}

export interface DeeplinkTemplate {
  id: string
  appId: string
  name: string
  description: string
  host: string
  path: string
  fragment: string
  queryParams: Record<string, QueryParam>
  imported?: boolean
}

export interface LaunchHistoryEntry {
  id: string
  timestamp: string
  deeplinkName: string
  uri: string
  environment: string
  orgId?: string
  deeplink?: DeeplinkTemplate
  app?: App
  environmentSnapshot?: Environment
  pathValues?: Record<string, string>
  queryValues?: Record<string, string | boolean | string[]>
}
