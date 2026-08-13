<script setup lang="ts">
import {ref, onMounted, watch} from 'vue'
import type {Environment, LinkFile, LinkFileBundle} from '@/types'
import {getLinkFiles} from '@/api/client'

const props = defineProps<{
  orgId: string
  appId: string
  environment: Environment
}>()

const emit = defineEmits<{ close: [] }>()

const bundle = ref<LinkFileBundle | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const copied = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    bundle.value = await getLinkFiles(props.orgId, props.appId, props.environment.name)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to generate link files'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.environment.name, load)

async function copy(file: LinkFile) {
  await navigator.clipboard.writeText(file.content)
  copied.value = file.filename
  setTimeout(() => {
    if (copied.value === file.filename) copied.value = null
  }, 1500)
}

function download(file: LinkFile) {
  // Apple's file has no extension and browsers like to add one, so the download
  // is driven off a Blob with an explicit filename rather than a link to the API.
  const blob = new Blob([file.content], {type: file.contentType})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function platformLabel(file: LinkFile) {
  return file.platform === 'android' ? 'Android · App Links' : 'iOS · Universal Links'
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click="onOverlayClick">
    <div class="modal link-files-modal">
      <div class="modal-header">
        <div>
          <div class="modal-title">Link files</div>
          <div class="modal-subtitle">
            {{ environment.name }}
            <template v-if="bundle?.linkDomain"> · {{ bundle.linkDomain }}</template>
          </div>
        </div>
        <button class="modal-close" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Generating…
        </div>

        <div v-else-if="error" class="error-message">
          {{ error }}
          <button class="btn btn-secondary btn-sm" style="margin-left: 8px" @click="load">Retry</button>
        </div>

        <template v-else-if="bundle">
          <p class="intro">
            Host these on your link domain over https, unredirected, and Android and iOS will
            hand matching URLs to the app instead of the browser.
          </p>

          <div v-if="bundle.warnings.length > 0" class="warnings">
            <div v-for="warning in bundle.warnings" :key="warning" class="warning-row">
              <span class="warning-icon">!</span>
              <span>{{ warning }}</span>
            </div>
          </div>

          <div v-for="file in bundle.files" :key="file.filename" class="file">
            <div class="file-header">
              <div>
                <div class="file-name">{{ file.filename }}</div>
                <div class="file-platform">{{ platformLabel(file) }}</div>
              </div>
              <div class="file-actions">
                <button class="btn btn-secondary btn-sm" @click="copy(file)">
                  {{ copied === file.filename ? 'Copied' : 'Copy' }}
                </button>
                <button class="btn btn-secondary btn-sm" @click="download(file)">Download</button>
              </div>
            </div>
            <div class="file-target">
              <span v-if="file.url">{{ file.url }}</span>
              <span v-else class="file-target-missing">Set a link domain to know where this is served from — path: {{ file.path }}</span>
            </div>
            <pre class="file-content">{{ file.content }}</pre>
          </div>

          <div v-if="bundle.files.length === 0" class="empty">
            Add an Android package name or an Apple Team ID and bundle ID to this environment
            to generate its link files.
          </div>

          <details v-else class="hosting">
            <summary>Hosting requirements</summary>
            <ul>
              <li>Serve both files over https with a valid certificate, from the link domain itself.</li>
              <li>Return <code>Content-Type: application/json</code> — including for the extensionless Apple file.</li>
              <li>No redirects: both platforms follow none when fetching these.</li>
              <li>Android verification also needs <code>android:autoVerify="true"</code> on the intent filter; iOS needs the domain in the app's Associated Domains entitlement.</li>
            </ul>
          </details>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.link-files-modal {
  max-width: 720px;
}

@media (min-width: 640px) {
  .link-files-modal {
    max-width: 720px;
  }
}

.modal-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.intro {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 14px;
}

.warnings {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.warning-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(245, 179, 1, 0.12);
  color: var(--color-text);
}

.warning-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f5b301;
  color: #1a1a1a;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
}

.file-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-surface-raised);
}

.file-name {
  font-size: 13px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.file-platform {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.file-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.file-target {
  padding: 8px 12px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--color-primary);
  border-bottom: 1px solid var(--color-border);
  word-break: break-all;
}

.file-target-missing {
  color: var(--color-text-muted);
  font-family: inherit;
}

.file-content {
  margin: 0;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-surface);
  overflow-x: auto;
  white-space: pre;
}

.empty {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 16px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  text-align: center;
}

.hosting {
  font-size: 12px;
  color: var(--color-text-muted);
}

.hosting summary {
  cursor: pointer;
  font-weight: 600;
  padding: 6px 0;
}

.hosting ul {
  margin: 6px 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hosting code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  background: var(--color-surface-raised);
  padding: 1px 4px;
  border-radius: 4px;
}
</style>
