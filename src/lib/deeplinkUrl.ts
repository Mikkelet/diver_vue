import type {Environment, UrlForm} from '@/types'

/** Tolerates schemes stored as `myapp`, `myapp:` or `myapp://`. */
export function normalizeScheme(scheme: string | undefined): string {
  return (scheme ?? '').trim().replace(/:\/?\/?$/, '')
}

/** The URL forms this environment is configured for, in preference order. */
export function availableForms(env: Environment | null): UrlForm[] {
  if (!env) return []
  const forms: UrlForm[] = []
  if (normalizeScheme(env.scheme)) forms.push('scheme')
  if (env.linkDomain) forms.push('https')
  return forms
}

/**
 * Everything up to (but excluding) the query string.
 *
 * The two forms address the same destination differently: with a custom scheme
 * the deeplink's host *is* the URI authority (`myapp://product/42`), while over
 * https the link domain is the authority and the host slides down into the
 * first path segment (`https://links.example.com/product/42`). Route tables are
 * written once, in the scheme's shape, so this is where the https shape is
 * derived — including in the generated apple-app-site-association, which has to
 * agree with it.
 */
export function buildBaseUrl(
  env: Environment | null,
  form: UrlForm,
  host: string,
  path: string,
): string {
  if (!env) return ''

  let suffix = path ?? ''
  if (suffix && !suffix.startsWith('/')) suffix = `/${suffix}`

  if (form === 'https') {
    if (!env.linkDomain) return ''
    const segment = host ? `/${host.replace(/^\/+/, '')}` : ''
    return `https://${env.linkDomain}${segment}${suffix}`
  }

  const scheme = normalizeScheme(env.scheme)
  if (!scheme) return ''
  return `${scheme}://${host}${suffix}`
}
