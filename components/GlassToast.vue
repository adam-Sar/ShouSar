<script setup lang="ts">
const { message, visible } = useToast()
</script>

<template>
  <div class="glass-toast" :class="{ show: visible }" role="status" aria-live="polite">
    {{ message }}
  </div>
</template>
