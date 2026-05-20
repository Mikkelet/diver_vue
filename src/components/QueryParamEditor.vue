<script setup lang="ts">
import { ref, watch } from 'vue'
import type { QueryParamType } from '@/types'

interface QueryParamEntry {
  key: string
  type: QueryParamType
}

const props = defineProps<{
  modelValue: Record<string, QueryParamType>
}>()

const emit = defineEmits<{
  'update:modelValue': [params: Record<string, QueryParamType>]
}>()

function recordToEntries(record: Record<string, QueryParamType>): QueryParamEntry[] {
  return Object.entries(record).map(([key, type]) => ({ key, type }))
}

function entriesToRecord(entries: QueryParamEntry[]): Record<string, QueryParamType> {
  const result: Record<string, QueryParamType> = {}
  for (const entry of entries) {
    if (entry.key.trim()) {
      result[entry.key.trim()] = entry.type
    }
  }
  return result
}

const params = ref<QueryParamEntry[]>(recordToEntries(props.modelValue))
let suppressWatch = false

watch(
  () => props.modelValue,
  (val) => {
    if (suppressWatch) {
      suppressWatch = false
      return
    }
    params.value = recordToEntries(val)
  }
)

function addParam() {
  params.value.push({ key: '', type: 'string' })
  // Don't emit — empty key would be filtered out and the watch would wipe the row.
}

function removeParam(index: number) {
  params.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  suppressWatch = true
  emit('update:modelValue', entriesToRecord(params.value))
}
</script>

<template>
  <div class="qp-editor">
    <div
      v-for="(param, index) in params"
      :key="index"
      class="qp-row"
    >
      <input
        v-model="param.key"
        class="form-input qp-key"
        placeholder="Parameter key"
        @input="emitUpdate"
      />
      <select
        v-model="param.type"
        class="form-select qp-type"
        @change="emitUpdate"
      >
        <option value="string">string</option>
        <option value="boolean">boolean</option>
        <option value="list">list</option>
      </select>
      <button
        type="button"
        class="remove-btn"
        @click="removeParam(index)"
        title="Remove parameter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <button type="button" class="add-param-btn" @click="addParam">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Add Query Parameter
    </button>
  </div>
</template>

<style scoped>
.qp-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qp-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qp-key {
  flex: 1;
}

.qp-type {
  width: 110px;
  flex-shrink: 0;
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

.add-param-btn {
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

.add-param-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
