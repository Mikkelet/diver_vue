import axios from 'axios'
import type {Organization, App, DeeplinkTemplate, Environment} from '@/types'

// API returns environments as { name: scheme } map; client expects Environment[].
type ApiApp = Omit<App, 'environments'> & { environments: Record<string, string> }

function normalizeApp(api: ApiApp): App {
    const envs: Environment[] = api.environments
        ? Object.entries(api.environments).map(([name, scheme]) => ({name, scheme}))
        : []
    return {...api, environments: envs}
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const {config, response} = error
        const method = config?.method?.toUpperCase() ?? 'REQUEST'
        const url = config?.url ?? ''
        const data = response.data
        console.error({"data": data})
        if (data) {
            console.error(`[API] ${method} ${url} → ${response.status} ${response.statusText}`, response.data)
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

export const createOrganization = (name: string) =>
    api.post<Organization>('/organizations', {name}).then(r => r.data)

export const getOrganization = (orgId: string) =>
    api.get<Organization>(`/organizations/${orgId}`).then(r => r.data)

export const deleteOrganization = (orgId: string) =>
    api.delete(`/organizations/${orgId}`)

// Apps
export const getApps = (orgId: string) =>
    api.get<ApiApp[]>(`/organizations/${orgId}/apps`).then(r => r.data.map(normalizeApp))

export const createApp = (
    orgId: string,
    data: { name: string; environments: Record<string, string> }
) => api.post<ApiApp>(`/organizations/${orgId}/apps`, data).then(r => normalizeApp(r.data))

export const getApp = (orgId: string, appId: string) =>
    api.get<ApiApp>(`/organizations/${orgId}/apps/${appId}`).then(r => normalizeApp(r.data))

export async function updateApp(
    orgId: string,
    appId: string,
    data: { name: string; environments: Record<string, string> }
): Promise<App> {
    const response = await api.put<ApiApp>(`/organizations/${orgId}/apps/${appId}`, data)
    return normalizeApp(response.data)
}

export const deleteApp = (orgId: string, appId: string) =>
    api.delete(`/organizations/${orgId}/apps/${appId}`)

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
