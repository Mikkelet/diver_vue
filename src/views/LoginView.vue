<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isSignup = computed(() => route.name === 'signup')

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

/** Mirrors MIN_PASSWORD_LENGTH in diver_auth. */
const MIN_PASSWORD_LENGTH = 8

const passwordTooShort = computed(
    () => isSignup.value && password.value.length > 0 && password.value.length < MIN_PASSWORD_LENGTH,
)

const canSubmit = computed(() =>
    !loading.value &&
    email.value.trim().length > 0 &&
    password.value.length > 0 &&
    !passwordTooShort.value,
)

// Clear transient state when switching between sign-in and sign-up.
watch(isSignup, () => {
  error.value = ''
  password.value = ''
})

function redirectAfterLogin() {
  const redirect = route.query.redirect
  router.replace(typeof redirect === 'string' ? redirect : '/')
}

async function submit() {
  if (!canSubmit.value) return
  error.value = ''
  loading.value = true
  try {
    if (isSignup.value) {
      await authStore.signUpWithEmail(name.value, email.value, password.value)
    } else {
      await authStore.signInWithEmail(email.value, password.value)
    }
    redirectAfterLogin()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  router.replace({
    name: isSignup.value ? 'login' : 'signup',
    query: route.query,
  })
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">🤿</span>
        <span class="logo-text">Diver</span>
      </div>
      <h1 class="login-title">{{ isSignup ? 'Create your account' : 'Welcome back' }}</h1>
      <p class="login-subtitle">
        {{ isSignup ? 'Sign up to start managing deeplinks.' : 'Sign in to continue.' }}
      </p>

      <form class="login-form" @submit.prevent="submit">
        <label v-if="isSignup" class="field">
          <span class="field-label">Name</span>
          <input
              v-model="name"
              type="text"
              autocomplete="name"
              placeholder="Your name"
          />
        </label>

        <label class="field">
          <span class="field-label">Email</span>
          <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
          />
        </label>

        <label class="field">
          <span class="field-label">Password</span>
          <div class="password-wrap">
            <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="isSignup ? 'new-password' : 'current-password'"
                placeholder="••••••••"
                required
            />
            <button
                type="button"
                class="reveal-btn"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="isSignup" class="field-hint" :class="{'field-hint-warn': passwordTooShort}">
            At least {{ MIN_PASSWORD_LENGTH }} characters.
          </span>
        </label>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="!canSubmit">
          {{ loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in' }}
        </button>
      </form>

      <div class="mode-toggle">
        {{ isSignup ? 'Already have an account?' : "Don't have an account?" }}
        <button class="mode-toggle-btn" @click="toggleMode">
          {{ isSignup ? 'Sign in' : 'Sign up' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 32px 28px;
  box-shadow: var(--shadow-lg, 0 8px 30px rgba(0, 0, 0, 0.12));
}

.login-logo {
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

.login-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.field input {
  width: 100%;
  font-size: 14px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrap input {
  padding-right: 58px;
}

.reveal-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  padding: 4px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
}

.reveal-btn:hover {
  color: var(--color-text);
}

.field-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.field-hint-warn {
  color: #f59e0b;
}

.login-error {
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 9px 12px;
}

.submit-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.12s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.mode-toggle {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

.mode-toggle-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
}

.mode-toggle-btn:hover {
  text-decoration: underline;
}
</style>
