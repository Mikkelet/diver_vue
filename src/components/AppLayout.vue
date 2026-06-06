<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import OrgSidebar from './OrgSidebar.vue'

const themeStore = useThemeStore()
const router = useRouter()
const sidebarOpen = ref(false)

const mode = import.meta.env.MODE
const envBadge = computed(() => {
  if (mode === 'production') return null
  if (mode === 'staging') return { label: 'staging', class: 'env-badge--staging' }
  return { label: 'dev', class: 'env-badge--dev' }
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="hamburger" @click="toggleSidebar" aria-label="Toggle sidebar">
          <span></span><span></span><span></span>
        </button>
        <button class="logo-btn" @click="goHome">
          <span class="logo-icon">🤿</span>
          <span class="logo-text">Diver</span>
        </button>
        <span v-if="envBadge" :class="['env-badge', envBadge.class]">{{ envBadge.label }}</span>
      </div>
      <div class="header-right">
<RouterLink to="/tester" class="icon-link" title="URL Tester" aria-label="URL Tester">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 3h6"/>
            <path d="M10 3v6.5L4.5 19a2 2 0 001.7 3h11.6a2 2 0 001.7-3L14 9.5V3"/>
            <path d="M7 14h10"/>
          </svg>
        </RouterLink>
        <RouterLink to="/launch-history" class="icon-link" title="Launch History" aria-label="Launch History">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </RouterLink>
        <button class="theme-toggle" @click="themeStore.toggleTheme" :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <span v-if="themeStore.isDark">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>

    <!-- Body -->
    <div class="layout-body">
      <!-- Sidebar overlay (mobile) -->
      <div
        v-if="sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
      />

      <!-- Sidebar -->
      <aside :class="['sidebar', { 'sidebar-open': sidebarOpen }]">
        <OrgSidebar @navigate="closeSidebar" />
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background: var(--color-header);
  border-bottom: 1px solid var(--color-border);
  z-index: 10;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo-btn:hover {
  color: var(--color-primary);
}

.logo-icon {
  font-size: 22px;
}

.env-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 10px;
  line-height: 1.4;
}

.env-badge--dev {
  background: #2563eb22;
  color: #3b82f6;
  border: 1px solid #3b82f640;
}

.env-badge--staging {
  background: #d9770622;
  color: #f59e0b;
  border: 1px solid #f59e0b40;
}

.history-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.history-link:hover {
  color: var(--color-text);
}

.icon-link {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

@media (hover: hover) {
  .icon-link:hover {
    background: var(--color-border);
  }
}

.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.theme-toggle:hover {
  background: var(--color-border);
}

.hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}

.hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: background 0.15s;
}

.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  z-index: 20;
}

.sidebar-overlay {
  display: none;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
}

/* Mobile */
@media (max-width: 767px) {
  .hamburger {
    display: flex;
  }


  .sidebar {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow-lg);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    top: 56px;
    background: rgba(0,0,0,0.4);
    z-index: 15;
  }
}
</style>
