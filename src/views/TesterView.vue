<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'

const url = ref('')
const error = ref<string | null>(null)

function openUrl() {
  error.value = null
  const value = url.value.trim()
  if (!value) {
    error.value = 'Please enter a URL'
    return
  }
  try {
    window.open(value, '_blank')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to open URL'
  }
}
</script>

<template>
  <AppLayout>
    <div class="tester">
      <h1 class="title">URL Tester</h1>
      <p class="subtitle">Enter any URL or deeplink to open it.</p>

      <form class="row" @submit.prevent="openUrl">
        <input
          v-model="url"
          class="form-input url-input"
          type="text"
          placeholder="https://example.com or myapp://path"
          autofocus
        />
        <button type="submit" class="open-btn">Open</button>
      </form>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </AppLayout>
</template>

<style scoped>
.tester {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
}

.subtitle {
  color: var(--color-text-muted);
  margin: 0 0 24px;
}

.row {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
}

.open-btn {
  padding: 8px 18px;
  border-radius: 6px;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.open-btn:hover {
  opacity: 0.9;
}

.error {
  margin-top: 12px;
  color: var(--color-error);
  font-size: 13px;
}
</style>
