import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import * as session from '@/api/session'
import type {SessionUser} from '@/api/session'
import {useOrganizationsStore} from '@/stores/organizations'

/** Provider-agnostic view of the signed-in user. */
export interface AuthUser {
    sub: string
    email: string | null
    displayName: string | null
    photoURL: string | null
}

interface StoredSession {
    accessToken: string
    refreshToken: string
    /** Absolute epoch ms, derived from expiresIn at the time we received it. */
    expiresAt: number
    user: AuthUser
}

const STORAGE_KEY = 'diver_session'

/** Renew this far before actual expiry so in-flight requests never race it. */
const RENEW_SKEW_MS = 30_000

function toAuthUser(u: SessionUser): AuthUser {
    return {
        sub: u.subject,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: u.photoUrl ?? null,
    }
}

function load(): StoredSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as StoredSession) : null
    } catch {
        return null
    }
}

export const useAuthStore = defineStore('auth', () => {
    const current = ref<StoredSession | null>(load())
    const user = computed<AuthUser | null>(() => current.value?.user ?? null)
    const isAuthenticated = computed(() => current.value !== null)

    /** Guarantees one refresh in flight, however many requests are waiting. */
    let refreshInFlight: Promise<string | null> | null = null

    function persist(pair: session.TokenPair) {
        const stored: StoredSession = {
            accessToken: pair.accessToken,
            refreshToken: pair.refreshToken,
            expiresAt: Date.now() + pair.expiresIn * 1000,
            user: toAuthUser(pair.user),
        }
        current.value = stored
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    }

    function clear() {
        current.value = null
        localStorage.removeItem(STORAGE_KEY)
        // Organizations are per-user; leaving them cached would show this
        // account's orgs to whoever signs in next on this browser.
        useOrganizationsStore().clearOrganizations()
    }

    /**
     * Resolves once any persisted session is usable. Kept async and idempotent
     * so the router guard can await it on every navigation.
     */
    async function init(): Promise<void> {
        if (!current.value) return
        if (Date.now() < current.value.expiresAt - RENEW_SKEW_MS) return
        await getAccessToken()
    }

    async function signInWithEmail(email: string, password: string) {
        const pair = await session.login(email.trim().toLowerCase(), password)
        clear()
        persist(pair)
    }

    /** Registers then signs in — diver_auth deliberately returns no tokens. */
    async function signUpWithEmail(displayName: string, email: string, password: string) {
        const normalized = email.trim().toLowerCase()
        await session.register(normalized, password, displayName.trim() || undefined)
        await signInWithEmail(normalized, password)
    }

    async function logout() {
        const token = current.value?.refreshToken
        clear()
        if (token) await session.logout(token)
    }

    /**
     * A valid access token, refreshing first if it's close to expiry.
     * Returns null when there is no usable session — the guard then redirects.
     */
    async function getAccessToken(): Promise<string | null> {
        const stored = current.value
        if (!stored) return null
        if (Date.now() < stored.expiresAt - RENEW_SKEW_MS) return stored.accessToken

        if (!refreshInFlight) {
            refreshInFlight = session
                .refresh(stored.refreshToken)
                .then(pair => {
                    persist(pair)
                    return pair.accessToken
                })
                .catch(() => {
                    // Expired, revoked, or replayed — the session is over.
                    clear()
                    return null
                })
                .finally(() => {
                    refreshInFlight = null
                })
        }
        return refreshInFlight
    }

    return {
        user,
        isAuthenticated,
        init,
        signInWithEmail,
        signUpWithEmail,
        logout,
        getAccessToken,
    }
})
