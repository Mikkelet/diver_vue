<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {acceptInvitation, previewInvitation, type InvitationPreview} from '@/api/members'
import {useOrganizationsStore} from '@/stores/organizations'

const route = useRoute()
const router = useRouter()
const orgStore = useOrganizationsStore()

const token = route.params.token as string

const preview = ref<InvitationPreview | null>(null)
const loading = ref(true)
const accepting = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    preview.value = await previewInvitation(token)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'This invitation is invalid or has expired.'
  } finally {
    loading.value = false
  }
})

async function accept() {
  accepting.value = true
  error.value = ''
  try {
    const org = await acceptInvitation(token)
    // The sidebar is built from the caller's org list, which just changed.
    await orgStore.fetchAllOrganizations()
    await router.replace(`/org/${org.slug}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not accept the invitation.'
    accepting.value = false
  }
}
</script>

<template>
  <div class="invite-page">
    <div class="invite-card">
      <div class="invite-logo">
        <span class="logo-icon">🤿</span>
        <span class="logo-text">Diver</span>
      </div>

      <div v-if="loading" class="spinner" />

      <template v-else-if="preview">
        <h1 class="invite-title">Join {{ preview.organizationName }}</h1>
        <p class="invite-subtitle">
          You've been invited as <strong>{{ preview.role }}</strong>.
        </p>
        <p class="invite-meta">
          This invitation was sent to {{ preview.email }} — accept it while signed in as
          that account.
        </p>

        <div v-if="error" class="invite-error">{{ error }}</div>

        <button class="btn btn-primary invite-btn" :disabled="accepting" @click="accept">
          {{ accepting ? 'Joining…' : `Join ${preview.organizationName}` }}
        </button>
        <RouterLink to="/" class="invite-decline">Not now</RouterLink>
      </template>

      <template v-else>
        <h1 class="invite-title">Invitation unavailable</h1>
        <p class="invite-subtitle">{{ error }}</p>
        <RouterLink to="/" class="btn btn-secondary invite-btn">Go to Diver</RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
}

.invite-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 32px 28px;
  text-align: center;
}

.invite-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-text);
}

.invite-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}

.invite-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.invite-meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.invite-error {
  font-size: 13px;
  text-align: left;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.invite-btn {
  width: 100%;
  justify-content: center;
}

.invite-decline {
  display: inline-block;
  margin-top: 14px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.invite-decline:hover {
  color: var(--color-text);
}

.spinner {
  width: 26px;
  height: 26px;
  margin: 0 auto;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
