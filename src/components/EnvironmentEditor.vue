<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Environment } from '@/types'

const props = defineProps<{
  modelValue: Environment[]
}>()

const emit = defineEmits<{
  'update:modelValue': [envs: Environment[]]
}>()

const envs = ref<Environment[]>(props.modelValue.map(e => ({ ...e })))

watch(
  () => props.modelValue,
  (val) => {
    envs.value = val.map(e => ({ ...e }))
  }
)

function addEnv() {
  envs.value.push({ name: '', scheme: '' })
  emit('update:modelValue', envs.value)
}

function removeEnv(index: number) {
  envs.value.splice(index, 1)
  emit('update:modelValue', envs.value)
}

function updateEnv() {
  emit('update:modelValue', envs.value)
}
</script>

<template>
  <div class="env-editor">
    <div
      v-for="(env, index) in envs"
      :key="index"
      class="env-row"
    >
      <div class="env-fields">
        <input
          v-model="env.name"
          class="form-input"
          placeholder="Name (e.g. Production)"
          @input="updateEnv"
        />
        <input
          v-model="env.scheme"
          class="form-input"
          placeholder="Scheme (e.g. myapp)"
          @input="updateEnv"
        />
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
  gap: 8px;
}

.env-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-fields {
  display: flex;
  gap: 8px;
  flex: 1;
}

.env-fields .form-input {
  flex: 1;
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
