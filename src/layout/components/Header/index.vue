<template>
  <header class="layout-header">
    <div class="layout-header-left">
      <button class="header-logo" type="button" aria-label="AR V3">
        <svg class="header-logo__img" viewBox="0 0 394 403" role="img" aria-label="AR">
          <defs>
            <linearGradient id="header-brand-bg" x1="34" y1="364" x2="356" y2="39" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#00675f" />
              <stop offset="0.58" stop-color="#009688" />
              <stop offset="1" stop-color="#69c8bd" />
            </linearGradient>
            <linearGradient id="header-brand-glyph" x1="14%" y1="0" x2="84%" y2="100%">
              <stop offset="0" stop-color="#ffffff" />
              <stop offset="1" stop-color="#d7f0ed" />
            </linearGradient>
          </defs>
          <rect width="394" height="403" rx="82" fill="url(#header-brand-bg)" />
          <g transform="translate(15 28) scale(1.4)">
            <path d="M128 24L40 224H74L92 184H164L182 224H216L128 24ZM107 148L128 98L149 148H107Z" fill="url(#header-brand-glyph)" />
            <path d="M128 72H176C200 72 216 87 216 108C216 126 204 138 184 143L220 224H183L152 153H128V128H172C181 128 188 121 188 111C188 101 181 96 172 96H128V72Z" fill="url(#header-brand-glyph)" />
          </g>
        </svg>
      </button>
      <span class="header-divider" aria-hidden="true"></span>
      <button class="header-tenant header-tenant--clickable" type="button" aria-label="切換商戶">
        <div class="header-tenant__identity">
          <div class="header-tenant__time">
            <TimeOutline />
            <span>{{ headerTime }}</span>
            <span class="header-tenant__zone">{{ t('header.timezone') }}</span>
          </div>
          <div class="header-tenant__meta">
            <span>{{ t('header.tenant') }}</span>
            <span class="header-tenant__pill">{{ selectedTenantName }}</span>
            <span class="header-tenant__switch">{{ t('header.switchTenant') }} <ChevronDownOutline /></span>
          </div>
        </div>
      </button>
    </div>

    <div class="layout-header-center header-menu">
      <MegaMenu />
    </div>

    <div class="layout-header-right">
      <button class="layout-header-trigger layout-header-trigger-min" type="button" aria-label="全螢幕" title="全螢幕">
        <ExpandOutline />
      </button>
      <button class="layout-header-trigger layout-header-trigger-min header-count-entry" type="button" aria-label="在線" title="在線">
        <PeopleOutline />
        <span class="header-count">0</span>
      </button>
      <button class="layout-header-trigger layout-header-trigger-min header-count-entry" type="button" aria-label="出入款" title="出入款">
        <CashOutline />
        <span class="header-count">0</span>
      </button>
      <button class="layout-header-trigger layout-header-trigger-min header-notification" type="button" aria-label="通知" title="通知">
        <NotificationsOutline />
      </button>
      <button class="layout-header-trigger layout-header-trigger-min header-user" type="button" aria-label="使用者選單">
        <span class="avatar"><span class="header-avatar">AR</span><span class="header-avatar-divider" aria-hidden="true"></span><span>admin</span></span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  CashOutline,
  ChevronDownOutline,
  ExpandOutline,
  NotificationsOutline,
  PeopleOutline,
  TimeOutline,
} from '@vicons/ionicons5';
import MegaMenu from '../MegaMenu.vue';

const { t } = useI18n();
const tenantId = ref('AR Demo 商戶');
const selectedTenantName = computed(() => tenantId.value);
const headerTime = ref('');

function formatHeaderTime() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yerevan',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

headerTime.value = formatHeaderTime();
const headerClockTimer = setInterval(() => {
  headerTime.value = formatHeaderTime();
}, 1000);

onBeforeUnmount(() => clearInterval(headerClockTimer));
</script>
