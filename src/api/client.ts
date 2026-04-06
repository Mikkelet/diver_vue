import axios from 'axios'
import type { Organization, App, DeeplinkTemplate } from '@/types'

const api = axios.create({
  //baseURL: 'https://api.diver.mthy.dev',
  baseURL: 'localhost:3300',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Organizations
export const getOrganizations = () =>
  api.get<Organization[]>('/organizations').then(r => r.data)

export const createOrganization = (name: string) =>
  api.post<Organization>('/organizations', { name }).then(r => r.data)

export const getOrganization = (orgId: string) =>
  api.get<Organization>(`/organizations/${orgId}`).then(r => r.data)

export const deleteOrganization = (orgId: string) =>
  api.delete(`/organizations/${orgId}`)

// Apps
export const getApps = (orgId: string) =>
  api.get<App[]>(`/organizations/${orgId}/apps`).then(r => r.data)

export const createApp = (
  orgId: string,
  data: { name: string; environments: Record<string, string> }
) => api.post<App>(`/organizations/${orgId}/apps`, data).then(r => r.data)

export const getApp = (orgId: string, appId: string) =>
  api.get<App>(`/organizations/${orgId}/apps/${appId}`).then(r => r.data)

export const updateApp = (
  orgId: string,
  appId: string,
  data: { name: string; environments: Record<string, string> }
) => api.put<App>(`/organizations/${orgId}/apps/${appId}`, data).then(r => r.data)

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

export const updateDeeplink = (
  orgId: string,
  appId: string,
  deeplinkId: string,
  data: Omit<DeeplinkTemplate, 'id' | 'appId'>
) =>
  api
    .put<DeeplinkTemplate>(
      `/organizations/${orgId}/apps/${appId}/deeplinks/${deeplinkId}`,
      data
    )
    .then(r => r.data)

export const deleteDeeplink = (orgId: string, appId: string, deeplinkId: string) =>
  api.delete(`/organizations/${orgId}/apps/${appId}/deeplinks/${deeplinkId}`)

export default api
