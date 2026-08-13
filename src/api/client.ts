import axios from 'axios'
import {useAuthStore} from '@/stores/auth'
import type {Organization, App, DeeplinkTemplate, Environment, LinkFileBundle} from '@/types'

// The API omits `environments` entirely for an app that somehow has none, so
// every response is funnelled through here rather than trusted field-by-field.
type ApiApp = Omit<App, 'environments'> & { environments?: Environment[] }

function normalizeApp(api: ApiApp): App {
    return {...api, environments: api.environments ?? []}
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(async (config) => {
    const token = await useAuthStore().getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const {config, response} = error
        const method = config?.method?.toUpperCase() ?? 'REQUEST'
        const url = config?.url ?? ''
        // `response` is undefined on network failures — reading .data off it
        // threw a TypeError and masked the real error.
        const data = response?.data
        if (data) {
            console.error(`[API] ${method} ${url} → ${response.status} ${response.statusText}`, data)
            return Promise.reject(Error(data.toString()))
        }
        console.error(`[API] ${method} ${url} → network error`, error.message)
        return Promise.reject(error)
    },
)

// Organizations
export async function getOrganizations() {
    const response = await api.get<Organization[]>('/organizations')
    return response.data
}

export async function createOrganization(name: string) {
    const response = await api.post<Organization>('/organizations', {"name": name})
    return response.data
}

export const getOrganization = (orgId: string) =>
    api.get<Organization>(`/organizations/${orgId}`).then(r => r.data)

export const getOrganizationBySlug = (slug: string) =>
    api.get<Organization>(`/organizations/by-slug/${slug}`).then(r => r.data)

export const deleteOrganization = (orgId: string) =>
    api.delete(`/organizations/${orgId}`)

// Apps
export const getApps = (orgId: string) =>
    api.get<ApiApp[]>(`/organizations/${orgId}/apps`).then(r => r.data.map(normalizeApp))

export async function createApp(
    orgId: string,
    data: { name: string; environments: Environment[] }
): Promise<App> {
    const response = await api.post<ApiApp>(`/organizations/${orgId}/apps`, data)
    return normalizeApp(response.data)
}

export const getApp = (orgId: string, appId: string) =>
    api.get<ApiApp>(`/organizations/${orgId}/apps/${appId}`).then(r => normalizeApp(r.data))

export async function getAppBySlug(orgSlug: string, appSlug: string) {
    const r = await api.get<ApiApp>(`/organizations/by-slug/${orgSlug}/apps/by-slug/${appSlug}`)
    return normalizeApp(r.data)
}

export async function updateApp(
    orgId: string,
    appId: string,
    data: { name: string; environments: Environment[] }
): Promise<App> {
    const response = await api.put<ApiApp>(`/organizations/${orgId}/apps/${appId}`, data)
    return normalizeApp(response.data)
}

export const deleteApp = (orgId: string, appId: string) =>
    api.delete(`/organizations/${orgId}/apps/${appId}`)

/** assetlinks.json + apple-app-site-association for one environment. */
export const getLinkFiles = (orgId: string, appId: string, environment: string) =>
    api
        .get<LinkFileBundle>(
            `/organizations/${orgId}/apps/${appId}/environments/${encodeURIComponent(environment)}/link-files`
        )
        .then(r => r.data)

// Deeplinks
export const getDeeplinks = (orgId: string, appId: string) =>
    api
        .get<DeeplinkTemplate[]>(`/organizations/${orgId}/apps/${appId}/deeplinks`)
        .then(r => r.data)

export const createDeeplink = (
    orgId: string,
    appId: string,
    data: Omit<DeeplinkTemplate, 'id' | 'appId'>
) =>
    api
        .post<DeeplinkTemplate>(`/organizations/${orgId}/apps/${appId}/deeplinks`, data)
        .then(r => r.data)

export const getDeeplink = (orgId: string, appId: string, deeplinkId: string) =>
    api
        .get<DeeplinkTemplate>(
            `/organizations/${orgId}/apps/${appId}/deeplinks/${deeplinkId}`
        )
        .then(r => r.data)

export async function updateDeeplink(
    orgId: string,
    appId: string,
    deeplinkId: string,
    data: Omit<DeeplinkTemplate, 'id' | 'appId'>
) {
    const url = `/organizations/${orgId}/apps/${appId}/deeplinks/${deeplinkId}`
    const response = await api.put<DeeplinkTemplate>(url, data)
    return response.data
}


export const deleteDeeplink = (orgId: string, appId: string, deeplinkId: string) =>
    api.delete(`/organizations/${orgId}/apps/${appId}/deeplinks/${deeplinkId}`)

export default api
