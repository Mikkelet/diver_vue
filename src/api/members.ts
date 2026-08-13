import api from '@/api/client'
import type { Organization } from '@/types'

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'IMPORTER'

export interface Member {
    organizationId: string
    subject: string
    role: Role
    email?: string | null
    displayName?: string | null
    createdAt: number
}

export interface Invitation {
    id: string
    organizationId: string
    email: string
    role: Role
    invitedBy: string
    createdAt: number
    expiresAt: number
}

export interface InvitationPreview {
    organizationName: string
    email: string
    role: Role
    expiresAt: number
}

/** Seniority, mirroring Role.rank on the server. */
const RANK: Record<Role, number> = {OWNER: 3, ADMIN: 2, MEMBER: 1, IMPORTER: 0}

/**
 * Mirrors the server's `Role.outranks`. This only shapes the UI — the API
 * enforces the same rule, so a stale client can't grant anything.
 */
export const outranks = (actor: Role, target: Role) =>
    actor === 'OWNER' || RANK[actor] > RANK[target]

export const canManageMembers = (role: Role) => role === 'OWNER' || role === 'ADMIN'

// ── Members ────────────────────────────────────────────────

export const getMembers = (orgId: string) =>
    api.get<Member[]>(`/organizations/${orgId}/members`).then(r => r.data)

export const updateMemberRole = (orgId: string, subject: string, role: Role) =>
    api.put<Member>(`/organizations/${orgId}/members/${subject}`, {role}).then(r => r.data)

export const removeMember = (orgId: string, subject: string) =>
    api.delete(`/organizations/${orgId}/members/${subject}`)

// ── Invitations ────────────────────────────────────────────

export const getInvitations = (orgId: string) =>
    api.get<Invitation[]>(`/organizations/${orgId}/invitations`).then(r => r.data)

/** The raw token comes back exactly once; the server only stores its hash. */
export const createInvitation = (orgId: string, email: string, role: Role) =>
    api
        .post<{invitation: Invitation; token: string}>(
            `/organizations/${orgId}/invitations`, {email, role},
        )
        .then(r => r.data)

export const revokeInvitation = (orgId: string, invitationId: string) =>
    api.delete(`/organizations/${orgId}/invitations/${invitationId}`)

export const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`

// ── Redemption (caller is not a member yet) ────────────────

export const previewInvitation = (token: string) =>
    api.get<InvitationPreview>(`/invitations/${token}`).then(r => r.data)

export const acceptInvitation = (token: string) =>
    api.post<Organization>(`/invitations/${token}/accept`).then(r => r.data)

// ── API keys (CI credentials) ──────────────────────────────

export interface ApiKey {
    id: string
    organizationId: string
    appId?: string | null
    name: string
    createdBy: string
    createdAt: number
    lastUsedAt?: number | null
}

export const getApiKeys = (orgId: string) =>
    api.get<ApiKey[]>(`/organizations/${orgId}/api-keys`).then(r => r.data)

/** The secret comes back exactly once; the server only stores its hash. */
export const createApiKey = (orgId: string, name: string, appId?: string) =>
    api
        .post<{apiKey: ApiKey; key: string}>(`/organizations/${orgId}/api-keys`, {name, appId})
        .then(r => r.data)

export const revokeApiKey = (orgId: string, keyId: string) =>
    api.delete(`/organizations/${orgId}/api-keys/${keyId}`)
