<template>
  <n-layout class="v3-layout">
    <AppHeader />

    <n-layout-content :class="['v3-content', { 'v3-content--editor': isEditor }]">
      <div class="v3-content-head">
        <n-tabs
          class="v3-page-tabs"
          type="line"
          size="small"
          :value="'layoutConfig'"
          :animated="false"
          @update:value="handleTabChange"
        >
          <n-tab name="layoutConfig">版面配置</n-tab>
        </n-tabs>
      </div>
      <router-view />
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NLayout, NLayoutContent, NTab, NTabs } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from './components/Header/index.vue';

const route = useRoute();
const router = useRouter();
const isEditor = computed(() => route.name === 'config_layoutConfig_edit');

function handleTabChange() {
  if (route.name !== 'config_layoutConfig') router.push({ name: 'config_layoutConfig' });
}
</script>
