<script lang="ts">
let count = 0
</script>

<script setup lang="ts" generic="T extends Option">
export type Option = {
  label: string
  value: string | boolean | number | undefined
}

const group = `radio-group-${count++}`

const modelValue = defineModel<T['value']>()

const props = defineProps<{
  options: T[]
}>()
</script>

<template>
  <div class="group">
    <label class="radio" v-for="option of props.options" :key="option.label">
      <input
        type="radio"
        :name="group"
        :value="option.value"
        :checked="option.value === modelValue"
        @change="$emit('update:modelValue', option.value)"
      />
      {{ option.label }}
    </label>
  </div>
</template>

<style scoped>
.group {
  display: flex;
  place-items: center;
  place-content: center;
  font-size: 0.875rem;
}

.radio {
  display: flex;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s;
}

.radio:has(:checked) {
  background: #ebf2ff;
}
</style>
