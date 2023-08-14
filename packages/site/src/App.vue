<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import * as icons from 'dls-icons-vue-3'
import meta from 'dls-icons-data/meta.json'
import RadioGroup from './RadioGroup.vue'

const metadata = meta as Record<string, Record<string, unknown>>
const { SharedResources } = icons

const iconList = Object.entries(icons)
  .filter(([name]) => name.startsWith('Icon'))
  .sort(([a], [b]) => a.localeCompare(b))

const typeOptions = [
  { label: 'All', value: undefined },
  { label: 'Solid', value: 'solid' },
  { label: 'Outline', value: 'outline' }
]
const type = ref<(typeof typeOptions)[number]['value']>()

const activeOptions = [
  { label: 'Normal', value: undefined },
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]
const active = ref<(typeof activeOptions)[number]['value']>()

const filteredIconList = computed(() =>
  iconList.filter(([componentName]) => {
    if (query.value) {
      const q = query.value.toLowerCase()
      const name = componentName.slice(4).toLowerCase()
      const { desc = '', slug = '' } = metadata[componentName] as { desc?: string; slug?: string }
      if (
        !name.includes(q) &&
        !slug?.toLowerCase().includes(q) &&
        !desc?.toLowerCase().includes(q)
      ) {
        return false
      }
    }

    if (type.value === undefined) {
      return true
    }

    return type.value === metadata[name].type
  })
)

const query = ref<string>('')

// copy message
const messageOpen = ref<boolean>(false)

let messageTimer: number

function copy(name: string) {
  clearTimeout(messageTimer)

  navigator.clipboard.writeText(name)
  messageOpen.value = true

  messageTimer = setTimeout(() => {
    messageOpen.value = false
  }, 2018)
}

onBeforeUnmount(() => {
  clearTimeout(messageTimer)
})

// autofocus
let focusTimer: number

let queryEl = ref<HTMLInputElement>()

function focusQuery() {
  queryEl.value?.focus()
}

function delayFocusQuery() {
  clearTimeout(focusTimer)
  focusTimer = setTimeout(focusQuery, 2022)
}

onMounted(() => {
  window.addEventListener('focus', focusQuery)

  return () => {
    window.removeEventListener('focus', focusQuery)
  }
})
</script>

<template>
  <SharedResources />
  <main @click="delayFocusQuery">
    <h1 class="heading"><a href="https://github.com/ecomfe/dls-icons">Light Icons</a></h1>
    <section class="filter">
      <input
        class="query"
        v-model="query"
        autofocus
        placeholder="Type to search..."
        ref="queryEl"
      />
      <div class="options">
        <RadioGroup v-model="type" :options="typeOptions" />
        <RadioGroup v-model="active" :options="activeOptions" />
      </div>
    </section>

    <section class="icons">
      <div
        class="icon"
        :class="{ deprecated: metadata[name].deprecated }"
        v-for="[name, Icon] of filteredIconList"
        :key="name"
        :title="metadata[name].deprecated ? `${name} (Deprecated)` : name"
        @click="copy(name)"
      >
        <component :is="Icon" :active="active" />
      </div>
    </section>
  </main>
  <aside class="message" :class="{ open: messageOpen }">Copied to clipboard</aside>
</template>

<style>
:root {
  color: rgba(45, 52, 64, 0.8);
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  overflow-y: scroll;
}

body {
  margin: 2rem;
}
</style>

<style scoped>
.heading {
  position: fixed;
  top: 0;
  left: 0;
  padding: 0.25rem 0.5rem;
  border-bottom-right-radius: 8px;
  background-color: rgba(45, 52, 64, 0.98);
  color: #fff;
  font-size: 0.875rem;
}

.icons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 min(4rem, 4vw);
}

.icon {
  display: flex;
  width: 3rem;
  aspect-ratio: 1;
  place-items: center;
  place-content: center;
  border-radius: 8px;
  font-size: 2rem;
  transition:
    background 0.2s,
    color 0.2s;
  cursor: pointer;
}

.icon:not(.deprecated):hover {
  background: rgba(45, 52, 64, 0.05);
  color: rgb(45, 52, 64);
}

.icon:not(.deprecated):active {
  background: rgba(45, 52, 64, 0.1);
}

.filter {
  display: flex;
  flex-direction: column;
  place-items: center;
  margin: 4rem 0 2rem;
  gap: 2rem;
}

.query {
  width: 32rem;
  max-width: 80vw;
  height: 3rem;
  padding: 0 1rem;
  border: 2px solid rgba(45, 52, 64, 0.2);
  border-radius: 12px;
  text-align: center;
  font-size: 1.5rem;
  transition: box-shadow 0.2s;
}

.query::placeholder {
  opacity: 0.4;
}

.query:focus {
  border-color: #0054e6;
  box-shadow: 0 0 0 4px rgba(0, 84, 230, 0.2);
}

.options {
  display: flex;
  place-items: center;
  place-content: center;
  gap: 2rem;
}

.message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  padding: 0.5rem 0.75rem;
  background-color: rgba(45, 52, 64, 0.98);
  box-shadow: 0 4px 16px rgba(45, 52, 64, 0.6);
  color: #fff;
  font-size: 0.875rem;
  transform: translate(-50%, 200%);
  border-radius: 4px;
  opacity: 0;
  transition:
    transform 0.2s,
    opacity 0.2s;
}

.message.open {
  transform: translate(-50%, 0);
  opacity: 1;
}

.deprecated {
  opacity: 0.3;
  cursor: help;
}
</style>
