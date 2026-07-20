<template>
  <div class="mega-nav">
    <div
      v-for="(item, index) in mainMenus"
      :key="item.key"
      class="mega-nav__item"
      :class="{ 'is-open': openMenu === item.key }"
      @mouseenter="openMenuAt(item.key, $event, index)"
    >
      <span class="mega-nav__title">
        <component :is="item.icon" class="mega-nav__icon" />
        {{ t(item.label) }}
      </span>
    </div>

    <transition name="mega-fade">
      <div
        v-if="openMenu && activeMenuColumns.length"
        ref="panelRef"
        class="mega-panel"
        :style="{ left: `${panelLeft}px` }"
        @mouseenter="cancelMenuClose"
        @mouseleave="scheduleMenuClose"
      >
        <div v-for="group in activeMenuColumns" :key="group.key" class="mega-col">
          <div class="mega-col__title">{{ t(group.label) }}</div>
          <router-link
            v-for="entry in group.items"
            :key="entry.key"
            :to="entry.to"
            class="mega-col__item"
            :class="{ 'is-active': entry.key === 'config_layoutConfig' }"
            @click="openMenu = null"
          >
            <span class="mega-col__item-label">{{ t(entry.label) }}</span>
            <span class="mega-tag mega-tag--new">新</span>
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  GameControllerOutline,
  MegaphoneOutline,
  OptionsOutline,
  OptionsSharp,
  PeopleOutline,
  StatsChartOutline,
  WalletOutline,
  WarningOutline,
} from '@vicons/ionicons5';

interface MenuColumn {
  key: string;
  label: string;
  items: Array<{ key: string; label: string; to: string }>;
}
interface MainMenu {
  key: string;
  label: string;
  icon: Component;
  columns?: MenuColumn[];
}

const mainMenus: MainMenu[] = [
  { key: 'members', label: 'main.members', icon: PeopleOutline },
  { key: 'operations', label: 'main.operations', icon: MegaphoneOutline },
  { key: 'finance', label: 'main.finance', icon: WalletOutline },
  { key: 'games', label: 'main.games', icon: GameControllerOutline },
  {
    key: 'config',
    label: 'main.config',
    icon: OptionsOutline,
    columns: [{ key: 'cfg-system', label: 'systemConfig', items: [{ key: 'config_layoutConfig', label: 'layoutConfig', to: '/config-center/layoutConfig' }] }],
  },
  { key: 'report', label: 'main.report', icon: StatsChartOutline },
  { key: 'risk', label: 'main.risk', icon: WarningOutline },
  { key: 'system', label: 'main.system', icon: OptionsSharp },
];

const { t } = useI18n();
const openMenu = ref<string | null>(null);
const panelRef = ref<HTMLElement>();
const panelLeft = ref(0);
let menuCloseTimer: ReturnType<typeof setTimeout> | null = null;

function cancelMenuClose() {
  if (menuCloseTimer) clearTimeout(menuCloseTimer);
  menuCloseTimer = null;
}

function openMenuAt(key: string, event: MouseEvent, index: number) {
  cancelMenuClose();
  openMenu.value = key;
  const item = event.currentTarget as HTMLElement;
  panelLeft.value = item.offsetLeft;
  nextTick(() => {
    const panel = panelRef.value;
    if (!panel) return;
    panelLeft.value = index >= 4
      ? Math.max(0, item.offsetLeft + item.offsetWidth - panel.offsetWidth)
      : item.offsetLeft;
  });
}

function scheduleMenuClose() {
  cancelMenuClose();
  menuCloseTimer = setTimeout(() => {
    openMenu.value = null;
    menuCloseTimer = null;
  }, 120);
}

onBeforeUnmount(cancelMenuClose);

const activeMenuColumns = computed(() => {
  const item = mainMenus.find((menu) => menu.key === openMenu.value);
  return item?.columns ?? [];
});
</script>
