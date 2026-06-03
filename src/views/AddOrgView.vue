<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationsStore } from '@/stores/organizations'
import { createOrganization, getOrganization } from '@/api/client'
import AppLayout from '@/components/AppLayout.vue'

const router = useRouter()
const orgStore = useOrganizationsStore()

const activeTab = ref<'create' | 'join'>('create')

// Create form
const createName = ref('')
const createLoading = ref(false)
const createError = ref<string | null>(null)

// Join form
const joinId = ref('')
const joinLoading = ref(false)
const joinError = ref<string | null>(null)

async function handleCreate() {
  if (!createName.value.trim()) {
    createError.value = 'Organization name is required'
    return
  }
  createLoading.value = true
  createError.value = null
  try {
    const org = await createOrganization(createName.value.trim())
    orgStore.addOrganization(org)
    router.push(`/org/${org.slug}`)
  } catch (e: unknown) {
    console.log(e)
    createError.value =
      e instanceof Error ? e.message : 'Failed to create organization'
  } finally {
    createLoading.value = false
  }
}

async function handleJoin() {
  if (!joinId.value.trim()) {
    joinError.value = 'Organization ID is required'
    return
  }
  joinLoading.value = true
  joinError.value = null
  try {
    const org = await getOrganization(joinId.value.trim())
    orgStore.addOrganization(org)
    router.push(`/org/${org.slug}`)
  } catch (e: unknown) {
    joinError.value =
      e instanceof Error ? e.message : 'Organization not found'
  } finally {
    joinLoading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="form-view">
      <div class="form-container">
        <div class="form-header">
          <RouterLink to="/" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </RouterLink>
          <h1 class="form-title">Add Organization</h1>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'create' }]"
            @click="activeTab = 'create'"
          >
            Create New
          </button>
          <button
            :class="['tab', { active: activeTab === 'join' }]"
            @click="activeTab = 'join'"
          >
            Join Existing
          </button>
        </div>

        <!-- Create Tab -->
        <form v-if="activeTab === 'create'" @submit.prevent="handleCreate">
          <div v-if="createError" class="error-message">{{ createError }}</div>

          <div class="form-group">
            <label class="form-label">Organization Name</label>
            <input
              v-model="createName"
              class="form-input"
              placeholder="e.g. Acme Corp"
              autofocus
            />
          </div>

          <div class="form-actions">
            <RouterLink to="/" class="btn btn-secondary">Cancel</RouterLink>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="createLoading"
            >
              <div v-if="createLoading" class="spinner" style="width:14px;height:14px;border-width:2px"></div>
              {{ createLoading ? 'Creating…' : 'Create Organization' }}
            </button>
          </div>
        </form>

        <!-- Join Tab -->
        <form v-else @submit.prevent="handleJoin">
          <div v-if="joinError" class="error-message">{{ joinError }}</div>

          <div class="form-group">
            <label class="form-label">Organization ID</label>
            <input
              v-model="joinId"
              class="form-input"
              placeholder="Paste the organization ID"
              autofocus
            />
            <div class="form-hint">Ask a team member to copy their organization ID.</div>
          </div>

          <div class="form-actions">
            <RouterLink to="/" class="btn btn-secondary">Cancel</RouterLink>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="joinLoading"
            >
              <div v-if="joinLoading" class="spinner" style="width:14px;height:14px;border-width:2px"></div>
              {{ joinLoading ? 'Looking up…' : 'Join Organization' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.form-view {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.form-container {
  width: 100%;
  max-width: 480px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: background 0.12s;
}

.back-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.form-title {
  font-size: 22px;
  font-weight: 700;
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
