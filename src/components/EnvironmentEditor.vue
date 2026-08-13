<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Environment } from '@/types'

const props = defineProps<{
  modelValue: Environment[]
}>()

const emit = defineEmits<{
  'update:modelValue': [envs: Environment[]]
}>()

/**
 * The editor's own shape: flat and all-strings, because a half-typed package
 * name or a fingerprint list mid-paste has no valid [Environment] to be. Rows
 * are converted on every change; the API does the real validation.
 */
interface EnvRow {
  name: string
  scheme: string
  linkDomain: string
  androidPackageName: string
  fingerprints: string
  iosTeamId: string
  iosBundleId: string
  expanded: boolean
}

function toRow(env: Environment): EnvRow {
  const fingerprints = env.android?.sha256CertFingerprints ?? []
  const hasIdentity = !!env.android || !!env.ios
  return {
    name: env.name,
    scheme: env.scheme ?? '',
    linkDomain: env.linkDomain ?? '',
    androidPackageName: env.android?.packageName ?? '',
    fingerprints: fingerprints.join('\n'),
    iosTeamId: env.ios?.teamId ?? '',
    iosBundleId: env.ios?.bundleId ?? '',
    // Opened when there is something to see, so configured identities aren't
    // hidden behind a disclosure nobody thinks to click.
    expanded: hasIdentity,
  }
}

function toEnvironment(row: EnvRow): Environment {
  const digests = row.fingerprints
    .split(/[\s,]+/)
    .map(f => f.trim())
    .filter(Boolean)
  return {
    name: row.name.trim(),
    scheme: row.scheme.trim(),
    linkDomain: row.linkDomain.trim() || null,
    android: row.androidPackageName.trim()
      ? { packageName: row.androidPackageName.trim(), sha256CertFingerprints: digests }
      : null,
    // An app ID is TeamID.BundleID — half of one identifies nothing, so it is
    // sent as no identity rather than an incomplete one.
    ios: row.iosTeamId.trim() && row.iosBundleId.trim()
      ? { teamId: row.iosTeamId.trim(), bundleId: row.iosBundleId.trim() }
      : null,
  }
}

function emptyRow(): EnvRow {
  return {
    name: '',
    scheme: '',
    linkDomain: '',
    androidPackageName: '',
    fingerprints: '',
    iosTeamId: '',
    iosBundleId: '',
    expanded: false,
  }
}

const rows = ref<EnvRow[]>(props.modelValue.map(toRow))

/**
 * Rebuilds the rows only when the incoming value says something the rows don't
 * already say.
 *
 * The parent binds `v-model`, so every keystroke comes straight back here — and
 * a rebuild would run it through [toRow], which is lossy while a field is still
 * half-typed: a Team ID without a bundle ID is no identity at all, so the two
 * fields cleared themselves on every character. An identity check on the
 * emitted array isn't enough to spot the echo, because `ref()` hands it back
 * wrapped in a reactive proxy.
 */
watch(
  () => props.modelValue,
  (val) => {
    const incoming = JSON.stringify(val)
    if (incoming === JSON.stringify(rows.value.map(toEnvironment))) return
    rows.value = val.map(toRow)
  }
)

function addEnv() {
  rows.value.push(emptyRow())
  publish()
}

function removeEnv(index: number) {
  rows.value.splice(index, 1)
  publish()
}

/** One iOS field filled and not the other — the identity would be dropped. */
function halfFilledIos(row: EnvRow): boolean {
  return !!row.iosTeamId.trim() !== !!row.iosBundleId.trim()
}

function publish() {
  emit('update:modelValue', rows.value.map(toEnvironment))
}
</script>

<template>
  <div class="env-editor">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="env-row"
    >
      <div class="env-main">
        <div class="env-fields">
          <input
            v-model="row.name"
            class="form-input"
            placeholder="Name (e.g. Production)"
            @input="publish"
          />
          <input
            v-model="row.scheme"
            class="form-input"
            placeholder="Scheme (e.g. myapp)"
            @input="publish"
          />
        </div>

        <input
          v-model="row.linkDomain"
          class="form-input"
          placeholder="https link domain (e.g. links.example.com) — optional"
          @input="publish"
        />

        <button type="button" class="disclosure" @click="row.expanded = !row.expanded">
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
            :style="{ transform: row.expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }"
          >
            <path d="M9 18l6-6-6-6"/>
          </svg>
          App identity — for assetlinks.json and apple-app-site-association
        </button>

        <div v-if="row.expanded" class="identity">
          <div class="identity-group">
            <div class="identity-label">Android</div>
            <input
              v-model="row.androidPackageName"
              class="form-input"
              placeholder="Package name (e.g. com.example.app)"
              @input="publish"
            />
            <textarea
              v-model="row.fingerprints"
              class="form-input fingerprints"
              rows="2"
              placeholder="SHA-256 certificate fingerprints, one per line"
              @input="publish"
            ></textarea>
            <div class="identity-hint">
              List every signing key that reaches users — debug, upload, and Play App Signing.
            </div>
          </div>

          <div class="identity-group">
            <div class="identity-label">iOS</div>
            <div class="env-fields">
              <input
                v-model="row.iosTeamId"
                class="form-input"
                placeholder="Team ID (e.g. ABCDE12345)"
                @input="publish"
              />
              <input
                v-model="row.iosBundleId"
                class="form-input"
                placeholder="Bundle ID (e.g. com.example.app)"
                @input="publish"
              />
            </div>
            <div v-if="halfFilledIos(row)" class="identity-hint identity-hint--warn">
              Both are needed — the app ID is TeamID.BundleID.
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="remove-btn"
        @click="removeEnv(index)"
        title="Remove environment"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <button type="button" class="add-env-btn" @click="addEnv">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Add Environment
    </button>
  </div>
</template>

<style scoped>
.env-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.env-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.env-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.env-fields {
  display: flex;
  gap: 8px;
}

.env-fields .form-input {
  flex: 1;
  min-width: 0;
}

.disclosure {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
}

.disclosure:hover {
  color: var(--color-primary);
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  background: var(--color-surface-raised);
}

.identity-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.identity-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.fingerprints {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  resize: vertical;
}

.identity-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.identity-hint--warn {
  color: #f5b301;
}

.remove-btn {
  width: 32px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border-color: var(--color-error);
}

.add-env-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  width: 100%;
}

.add-env-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
