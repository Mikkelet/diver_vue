<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import {getApps, getOrganizationBySlug} from '@/api/client'
import {
  canManageMembers,
  createApiKey,
  createInvitation,
  getApiKeys,
  getInvitations,
  getMembers,
  inviteLink,
  outranks,
  removeMember,
  revokeApiKey,
  revokeInvitation,
  updateMemberRole,
  type ApiKey,
  type Invitation,
  type Member,
  type Role,
} from '@/api/members'
import {useAuthStore} from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const orgSlug = route.params.orgSlug as string
const orgId = ref('')
const orgName = ref('')

const members = ref<Member[]>([])
const invitations = ref<Invitation[]>([])
const loading = ref(true)
const error = ref('')

const apiKeys = ref<ApiKey[]>([])
const apps = ref<{id: string; name: string}[]>([])
const keyName = ref('')
const keyAppId = ref('')
const creatingKey = ref(false)
/** Shown once — the server keeps only a hash. */
const freshKey = ref('')
const keyCopied = ref(false)

const inviteEmail = ref('')
const inviteRole = ref<Role>('MEMBER')
const inviting = ref(false)
/** The one moment the raw token exists client-side; there is no mailer yet. */
const freshLink = ref('')
const copied = ref(false)

const me = computed(() => members.value.find(m => m.subject === authStore.user?.sub))
const myRole = computed<Role | null>(() => me.value?.role ?? null)
const canManage = computed(() => (myRole.value ? canManageMembers(myRole.value) : false))

const ROLES: Role[] = ['OWNER', 'ADMIN', 'MEMBER', 'IMPORTER']

/** Roles this viewer is allowed to hand out. Server enforces the same rule. */
const assignableRoles = computed(() =>
    myRole.value ? ROLES.filter(r => outranks(myRole.value!, r)) : [],
)

function canActOn(member: Member) {
  if (!myRole.value) return false
  if (member.subject === authStore.user?.sub) return false
  return canManage.value && outranks(myRole.value, member.role)
}

const ownerCount = computed(() => members.value.filter(m => m.role === 'OWNER').length)
const isLastOwner = computed(() => myRole.value === 'OWNER' && ownerCount.value === 1)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const org = await getOrganizationBySlug(orgSlug)
    orgId.value = org.id
    orgName.value = org.name
    members.value = await getMembers(org.id)
    // Only managers may list invitations; everyone else just sees the roster.
    if (canManage.value) {
      invitations.value = await getInvitations(org.id)
      apiKeys.value = await getApiKeys(org.id)
      apps.value = await getApps(org.id)
    } else {
      invitations.value = []
      apiKeys.value = []
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load members.'
  } finally {
    loading.value = false
  }
}

async function invite() {
  error.value = ''
  inviting.value = true
  freshLink.value = ''
  try {
    const created = await createInvitation(orgId.value, inviteEmail.value.trim(), inviteRole.value)
    freshLink.value = inviteLink(created.token)
    inviteEmail.value = ''
    invitations.value = await getInvitations(orgId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not create the invitation.'
  } finally {
    inviting.value = false
  }
}

async function createKey() {
  error.value = ''
  creatingKey.value = true
  freshKey.value = ''
  try {
    const created = await createApiKey(orgId.value, keyName.value.trim(), keyAppId.value || undefined)
    freshKey.value = created.key
    keyName.value = ''
    keyAppId.value = ''
    apiKeys.value = await getApiKeys(orgId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not create the key.'
  } finally {
    creatingKey.value = false
  }
}

async function copyKey() {
  await navigator.clipboard.writeText(freshKey.value)
  keyCopied.value = true
  setTimeout(() => (keyCopied.value = false), 1500)
}

async function revokeKey(key: ApiKey) {
  if (!confirm(`Revoke "${key.name}"? Any CI using it will start failing immediately.`)) return
  error.value = ''
  try {
    await revokeApiKey(orgId.value, key.id)
    apiKeys.value = await getApiKeys(orgId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not revoke that key.'
  }
}

const appName = (id?: string | null) =>
    id ? (apps.value.find(a => a.id === id)?.name ?? 'unknown app') : 'all apps'

async function copyLink() {
  await navigator.clipboard.writeText(freshLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

async function changeRole(member: Member, role: Role) {
  error.value = ''
  try {
    await updateMemberRole(orgId.value, member.subject, role)
    members.value = await getMembers(orgId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not change that role.'
    members.value = await getMembers(orgId.value)
  }
}

async function remove(member: Member) {
  const who = member.displayName || member.email || 'this member'
  if (!confirm(`Remove ${who} from ${orgName.value}?`)) return
  error.value = ''
  try {
    await removeMember(orgId.value, member.subject)
    members.value = await getMembers(orgId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not remove that member.'
  }
}

async function revoke(invitation: Invitation) {
  error.value = ''
  try {
    await revokeInvitation(orgId.value, invitation.id)
    invitations.value = await getInvitations(orgId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not revoke that invitation.'
  }
}

const expiryLabel = (ms: number) => {
  const days = Math.ceil((ms - Date.now()) / 86_400_000)
  return days <= 0 ? 'expired' : `expires in ${days}d`
}

onMounted(load)
</script>

<template>
  <AppLayout>
    <div class="members-page">
    <div class="content-header">
      <div>
        <h1 class="page-title">Members</h1>
        <div class="page-subtitle">{{ orgName }}</div>
      </div>
      <RouterLink :to="`/org/${orgSlug}`" class="btn btn-secondary">Back to apps</RouterLink>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- Invite -->
      <section v-if="canManage" class="card">
        <h2 class="card-title">Invite someone</h2>
        <form class="invite-form" @submit.prevent="invite">
          <input
              v-model="inviteEmail"
              type="email"
              placeholder="teammate@example.com"
              required
              class="invite-input"
          />
          <select v-model="inviteRole" class="invite-select">
            <option v-for="r in assignableRoles" :key="r" :value="r">{{ r }}</option>
          </select>
          <button type="submit" class="btn btn-primary" :disabled="inviting">
            {{ inviting ? 'Creating…' : 'Create invite' }}
          </button>
        </form>

        <div v-if="freshLink" class="fresh-link">
          <p class="fresh-link-note">
            Send this link to them — it's shown once and can't be recovered.
          </p>
          <div class="fresh-link-row">
            <code class="fresh-link-value">{{ freshLink }}</code>
            <button class="btn btn-secondary btn-sm" @click="copyLink">
              {{ copied ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Members -->
      <section class="card">
        <h2 class="card-title">People ({{ members.length }})</h2>
        <table class="members-table">
          <tbody>
          <tr v-for="m in members" :key="m.subject">
            <td>
              <div class="member-name">
                {{ m.displayName || m.email || m.subject }}
                <span v-if="m.subject === authStore.user?.sub" class="badge">you</span>
              </div>
              <div v-if="m.email && m.displayName" class="member-email">{{ m.email }}</div>
            </td>
            <td class="role-cell">
              <select
                  v-if="canActOn(m)"
                  :value="m.role"
                  class="invite-select"
                  @change="changeRole(m, ($event.target as HTMLSelectElement).value as Role)"
              >
                <option v-for="r in assignableRoles" :key="r" :value="r">{{ r }}</option>
                <option v-if="!assignableRoles.includes(m.role)" :value="m.role" disabled>
                  {{ m.role }}
                </option>
              </select>
              <span v-else class="badge">{{ m.role }}</span>
            </td>
            <td class="action-cell">
              <button v-if="canActOn(m)" class="btn btn-secondary btn-sm" @click="remove(m)">
                Remove
              </button>
              <button
                  v-else-if="m.subject === authStore.user?.sub"
                  class="btn btn-secondary btn-sm"
                  :disabled="isLastOwner"
                  :title="isLastOwner ? 'Promote another owner before leaving' : ''"
                  @click="remove(m)"
              >
                Leave
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </section>

      <!-- API keys -->
      <section v-if="canManage" class="card">
        <h2 class="card-title">API keys</h2>
        <p class="card-note">
          For CI. A key can import routes and read this organization — it cannot
          write deeplinks, see members, or change anything else.
        </p>
        <form class="invite-form" @submit.prevent="createKey">
          <input
              v-model="keyName"
              type="text"
              placeholder="e.g. GitHub Actions"
              required
              class="invite-input"
          />
          <select v-model="keyAppId" class="invite-select">
            <option value="">All apps</option>
            <option v-for="a in apps" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
          <button type="submit" class="btn btn-primary" :disabled="creatingKey">
            {{ creatingKey ? 'Creating…' : 'Create key' }}
          </button>
        </form>

        <div v-if="freshKey" class="fresh-link">
          <p class="fresh-link-note">
            Set this as <code>DIVER_API_KEY</code> in CI — it's shown once and
            can't be recovered.
          </p>
          <div class="fresh-link-row">
            <code class="fresh-link-value">{{ freshKey }}</code>
            <button class="btn btn-secondary btn-sm" @click="copyKey">
              {{ keyCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>

        <table v-if="apiKeys.length" class="members-table" style="margin-top: 14px">
          <tbody>
          <tr v-for="k in apiKeys" :key="k.id">
            <td>
              <div class="member-name">{{ k.name }}</div>
              <div class="member-email">
                {{ appName(k.appId) }} ·
                {{ k.lastUsedAt ? 'last used ' + new Date(k.lastUsedAt).toLocaleDateString() : 'never used' }}
              </div>
            </td>
            <td class="action-cell">
              <button class="btn btn-secondary btn-sm" @click="revokeKey(k)">Revoke</button>
            </td>
          </tr>
          </tbody>
        </table>
      </section>

      <!-- Pending invitations -->
      <section v-if="canManage && invitations.length" class="card">
        <h2 class="card-title">Pending invitations ({{ invitations.length }})</h2>
        <table class="members-table">
          <tbody>
          <tr v-for="i in invitations" :key="i.id">
            <td>
              <div class="member-name">{{ i.email }}</div>
              <div class="member-email">{{ expiryLabel(i.expiresAt) }}</div>
            </td>
            <td class="role-cell"><span class="badge">{{ i.role }}</span></td>
            <td class="action-cell">
              <button class="btn btn-secondary btn-sm" @click="revoke(i)">Revoke</button>
            </td>
          </tr>
          </tbody>
        </table>
      </section>
    </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.members-page {
  padding: 24px;
  max-width: 820px;
}

.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 18px;
}

.card-note {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
  margin: -8px 0 14px;
}

.card-note code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 14px;
}

.error-banner {
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
}

.invite-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.invite-input {
  flex: 1;
  min-width: 200px;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
}

.invite-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.invite-select {
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
}

.fresh-link {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.fresh-link-note {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.fresh-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fresh-link-value {
  flex: 1;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: var(--color-text);
  overflow-x: auto;
  white-space: nowrap;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
}

.members-table td {
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
  vertical-align: middle;
}

.members-table tr:first-child td {
  border-top: none;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.member-email {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.role-cell {
  width: 140px;
}

.action-cell {
  width: 100px;
  text-align: right;
}
</style>
