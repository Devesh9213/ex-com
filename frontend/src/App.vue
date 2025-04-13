<template>
  <router-view />
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.initialize()
</script>

<style>
/* Add any global styles here if needed */
</style>