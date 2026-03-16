<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main class="home-main">
    <TheWelcome />
  </main>
</template>

<style scoped>
.home-main {
  min-height: 100vh;
  overflow-y: auto;
  padding: 20px;
}
</style>
