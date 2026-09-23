<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <svg :class="props.class" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-0.64-0.06-1.25-0.16-1.84h-8.48v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.61z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-0.8 5.96-2.19l-2.9-2.26c-0.8 0.54-1.84 0.86-3.06 0.86-2.35 0-4.34-1.59-5.05-3.72h-3v2.33a9 9 0 0 0 8.05 4.98z"
    />
    <path
      fill="#FBBC05"
      d="M3.95 10.69a5.4 5.4 0 0 1-0.28-1.69c0-0.59 0.1-1.16 0.28-1.69v-2.33h-3a9 9 0 0 0-0.95 4.02c0 1.45 0.35 2.83 0.95 4.02l3-2.33z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.51 0.46 3.44 1.35l2.58-2.58c-1.56-1.46-3.59-2.35-6.02-2.35a9 9 0 0 0-8.05 4.98l3 2.33c0.71-2.14 2.7-3.73 5.05-3.73z"
    />
  </svg>
</template>
