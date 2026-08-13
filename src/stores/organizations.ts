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
  const currentOrgSlug = ref<string | null>(null)
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
    const removed = organizations.value.find(o => o.id === orgId)
    organizations.value = organizations.value.filter(o => o.id !== orgId)
    saveToStorage(organizations.value)
    if (removed && currentOrgSlug.value === removed.slug) {
      currentOrgSlug.value = null
      apps.value = []
    }
  }

  function setCurrentOrg(slug: string | null) {
    currentOrgSlug.value = slug
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

  /**
   * Replaces the cached list rather than merging into it.
   *
   * The API now returns only the organizations the signed-in user belongs to,
   * so the server is authoritative. Merging would leave another account's
   * organizations in this browser's cache after a logout, and would keep an
   * organization in the sidebar forever after someone is removed from it.
   */
  async function fetchAllOrganizations() {
    fetchOrgsLoading.value = true
    fetchOrgsError.value = null
    try {
      organizations.value = await getOrganizations()
      saveToStorage(organizations.value)
    } finally {
      fetchOrgsLoading.value = false
    }
  }

  /** Drops all cached org state. Called on logout so nothing leaks to the next user. */
  function clearOrganizations() {
    organizations.value = []
    currentOrgSlug.value = null
    apps.value = []
    localStorage.removeItem(STORAGE_KEY)
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
    currentOrgSlug,
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
    clearOrganizations,
    fetchOrgsLoading,
    fetchOrgsError,
  }
})
