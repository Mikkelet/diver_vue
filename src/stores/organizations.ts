import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Organization, App } from '@/types'
import { getOrganizations } from '@/api/client'

const STORAGE_KEY = 'diver_organizations'

function loadFromStorage(): Organization[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(orgs: Organization[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orgs))
}

export const useOrganizationsStore = defineStore('organizations', () => {
  const organizations = ref<Organization[]>(loadFromStorage())
  const currentOrgId = ref<string | null>(null)
  const apps = ref<App[]>([])
  const appsLoading = ref(false)
  const appsError = ref<string | null>(null)

  function addOrganization(org: Organization) {
    if (!organizations.value.find(o => o.id === org.id)) {
      organizations.value.push(org)
      saveToStorage(organizations.value)
    }
  }

  function removeOrganization(orgId: string) {
    organizations.value = organizations.value.filter(o => o.id !== orgId)
    saveToStorage(organizations.value)
    if (currentOrgId.value === orgId) {
      currentOrgId.value = null
      apps.value = []
    }
  }

  function setCurrentOrg(orgId: string | null) {
    currentOrgId.value = orgId
  }

  function setApps(newApps: App[]) {
    apps.value = newApps
  }

  function setAppsLoading(loading: boolean) {
    appsLoading.value = loading
  }

  function setAppsError(error: string | null) {
    appsError.value = error
  }

  function removeApp(appId: string) {
    apps.value = apps.value.filter(a => a.id !== appId)
  }

  const fetchOrgsLoading = ref(false)
  const fetchOrgsError = ref<string | null>(null)

  async function fetchAllOrganizations() {
    fetchOrgsLoading.value = true
    fetchOrgsError.value = null
    const all = await getOrganizations()
    for (const org of all) {
      if (!organizations.value.find(o => o.id === org.id)) {
        organizations.value.push(org)
      }
    }
    saveToStorage(organizations.value)
    fetchOrgsLoading.value = false
  }

  function addApp(app: App) {
    const idx = apps.value.findIndex(a => a.id === app.id)
    if (idx >= 0) {
      apps.value[idx] = app
    } else {
      apps.value.push(app)
    }
  }

  return {
    organizations,
    currentOrgId,
    apps,
    appsLoading,
    appsError,
    addOrganization,
    removeOrganization,
    setCurrentOrg,
    setApps,
    setAppsLoading,
    setAppsError,
    removeApp,
    addApp,
    fetchAllOrganizations,
    fetchOrgsLoading,
    fetchOrgsError,
  }
})
