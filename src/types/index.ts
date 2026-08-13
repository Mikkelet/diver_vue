export interface Organization {
  id: string
  name: string
  slug: string
}

export interface AndroidIdentity {
  packageName: string
  /** SHA-256 signing certificate digests, colon-separated hex. */
  sha256CertFingerprints: string[]
}

export interface IosIdentity {
  /** Apple Developer Team ID — the prefix of the app ID. */
  teamId: string
  bundleId: string
}

export interface Environment {
  name: string
  scheme: string
  /** Bare host for https App Links / Universal Links, e.g. links.example.com. */
  linkDomain?: string | null
  android?: AndroidIdentity | null
  ios?: IosIdentity | null
}

/** How a deeplink is addressed: the custom scheme, or an https link. */
export type UrlForm = 'scheme' | 'https'

/** One verification file, rendered exactly as it must be hosted. */
export interface LinkFile {
  platform: 'android' | 'ios'
  filename: string
  path: string
  url: string | null
  contentType: string
  content: string
}

export interface LinkFileBundle {
  environment: string
  linkDomain: string | null
  files: LinkFile[]
  warnings: string[]
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
  urlForm?: UrlForm
  orgId?: string
  deeplink?: DeeplinkTemplate
  app?: App
  environmentSnapshot?: Environment
  pathValues?: Record<string, string>
  queryValues?: Record<string, string | boolean | string[]>
}
