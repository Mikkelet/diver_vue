<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useOrganizationsStore} from '@/stores/organizations'

const emit = defineEmits<{ navigate: [] }>()

const router = useRouter()
const route = useRoute()
const orgStore = useOrganizationsStore()
const orgsError = ref<string | null>(null)


const currentOrgSlug = computed(() => route.params.orgSlug as string | undefined)

function selectOrg(slug: string) {
  router.push(`/org/${slug}`)
  emit('navigate')
}

function addOrg() {
  router.push('/add-org')
  emit('navigate')
}

async function fetchOrgs() {
  if (import.meta.env.MODE === 'staging') {
    try {
      await orgStore.fetchAllOrganizations()
    } catch (e: any) {
      orgsError.value = e.toString()
    }
  }
}

function removeOrg(e: Event, org: { id: string; slug: string }) {
  e.stopPropagation()
  if (confirm('Remove this organization from your list?')) {
    orgStore.removeOrganization(org.id)
    if (currentOrgSlug.value === org.slug) {
      router.push('/')
    }
  }
}

onMounted(async () => {
  fetchOrgs()
})

async function copyOrgId(e: Event, orgId: string) {
  e.stopPropagation()
  await navigator.clipboard.writeText(orgId)
}
</script>

<template>
  <div class="org-sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">Organizations</span>
    </div>

    <div class="org-list">
      <div
          v-for="org in orgStore.organizations"
          :key="org.id"
          :class="['org-item', { active: currentOrgSlug === org.slug }]"
          @click="selectOrg(org.slug)"
      >
        <div class="org-avatar">{{ org.name.charAt(0).toUpperCase() }}</div>
        <div class="org-info">
          <div class="org-name">{{ org.name }}</div>
          <div class="org-slug">{{ org.slug }}</div>
        </div>
        <div class="org-actions">
          <button
              class="action-btn"
              title="Copy ID"
              @click="copyOrgId($event, org.id)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button
              class="action-btn action-btn-danger"
              title="Remove"
              @click="removeOrg($event, org)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="orgsError" class="fetch-error">
        <p>{{ orgsError }}</p>
        <button class="btn btn-sm btn-secondary" @click="fetchOrgs()">Retry</button>
      </div>

      <div v-else-if="orgStore.organizations.length === 0" class="no-orgs">
        <p>No organizations yet</p>
      </div>
    </div>

    <div class="sidebar-footer">
      <button class="add-org-btn" @click="addOrg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Organization
      </button>
    </div>
  </div>
</template>

<style scoped>
.org-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 16px 14px 10px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.org-list {
  flex: 1;
  padding: 8px 8px 0;
  overflow-y: auto;
}

.org-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 2px;
}

.org-item:hover {
  background: var(--color-sidebar-item-hover);
}

.org-item.active {
  background: var(--color-sidebar-item-active);
}

.org-item.active .org-name {
  color: var(--color-primary);
  font-weight: 600;
}

.org-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.org-info {
  flex: 1;
  min-width: 0;
}

.org-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-slug {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-actions {
  display: none;
  gap: 2px;
  flex-shrink: 0;
}

.org-item:hover .org-actions {
  display: flex;
}

@media (hover: none) {
  .org-actions {
    display: flex;
  }
}

.action-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.action-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.action-btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.fetch-error {
  padding: 12px;
  margin: 8px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  text-align: center;
  font-size: 12px;
  color: var(--color-error);
}

.fetch-error p {
  margin: 0 0 8px;
}

.no-orgs {
  padding: 24px 12px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--color-border);
}

.add-org-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px dashed var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.add-org-btn:hover {
  background: var(--color-sidebar-item-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
