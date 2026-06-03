<script setup lang="ts">
import {watch, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {useOrganizationsStore} from '@/stores/organizations'
import {getApps, getOrganizationBySlug} from '@/api/client'
import AppLayout from '@/components/AppLayout.vue'
import AppCard from '@/components/AppCard.vue'

const route = useRoute()
const orgStore = useOrganizationsStore()

const orgSlug = () => route.params.orgSlug as string | undefined

const currentOrg = () =>
    orgSlug() ? orgStore.organizations.find(o => o.slug === orgSlug()) : null

async function loadAppsBySlug(slug: string) {
  orgStore.setAppsLoading(true)
  orgStore.setAppsError(null)
  try {
    let org = orgStore.organizations.find(o => o.slug === slug)
    if (!org) {
      org = await getOrganizationBySlug(slug)
      orgStore.addOrganization(org)
    }
    const apps = await getApps(org.id)
    orgStore.setApps(apps)
  } catch (e: unknown) {
    orgStore.setAppsError(
        e instanceof Error ? e.message : 'Failed to load apps'
    )
  } finally {
    orgStore.setAppsLoading(false)
  }
}

watch(
    () => route.params.orgSlug,
    (slug) => {
      if (slug) {
        orgStore.setCurrentOrg(slug as string)
        loadAppsBySlug(slug as string)
      } else {
        orgStore.setCurrentOrg(null)
        orgStore.setApps([])
      }
    }
)

onMounted(() => {
  const slug = orgSlug()
  if (slug) {
    orgStore.setCurrentOrg(slug)
    loadAppsBySlug(slug)
  }
})

</script>

<template>
  <AppLayout>
    <div class="home-view">
      <!-- No org selected -->
      <div v-if="!orgSlug()" class="empty-state">
        <div class="empty-state-icon">🤿</div>
        <h3>Welcome to Diver</h3>
        <p>Select or add an organization from the sidebar to get started.</p>
        <RouterLink to="/add-org" class="btn btn-primary" style="margin-top: 16px; display: inline-flex;">
          Add Organization
        </RouterLink>
      </div>

      <!-- Org not found in local list -->
      <div v-else-if="!currentOrg()" class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Organization not found</h3>
        <p>This organization is not in your saved list.</p>
      </div>

      <!-- Org content -->
      <template v-else>
        <div class="content-header">
          <div>
            <h1 class="page-title">{{ currentOrg()!.name }}</h1>
            <div class="page-subtitle">Apps</div>
          </div>
          <RouterLink
              :to="`/org/${orgSlug()}/add-app`"
              class="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add App
          </RouterLink>
        </div>

        <!-- Loading -->
        <div v-if="orgStore.appsLoading" class="loading">
          <div class="spinner"></div>
          Loading apps…
        </div>

        <!-- Error -->
        <div v-else-if="orgStore.appsError" class="error-message" style="margin: 20px">
          {{ orgStore.appsError }}
        </div>

        <!-- Empty -->
        <div v-else-if="orgStore.apps.length === 0" class="empty-state">
          <div class="empty-state-icon">📱</div>
          <h3>No apps yet</h3>
          <p>Add your first app to start managing deeplinks.</p>
          <RouterLink
              :to="`/org/${orgSlug()}/add-app`"
              class="btn btn-primary"
              style="margin-top: 16px; display: inline-flex;"
          >
            Add App
          </RouterLink>
        </div>

        <!-- App list -->
        <div v-else class="apps-grid">
          <AppCard
              v-for="app in orgStore.apps"
              :key="app.id"
              :app="app"
              :orgSlug="orgSlug()!"
          />
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.home-view {
  height: 100%;
}

.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.apps-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 24px 24px;
}

@media (max-width: 600px) {
  .content-header {
    padding: 16px 16px 12px;
  }

  .apps-grid {
    padding: 0 16px 16px;
  }
}
</style>
