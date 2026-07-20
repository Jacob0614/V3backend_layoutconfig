<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme-overrides="themeOverrides"
    :inline-theme-disabled="true"
  >
    <n-notification-provider>
      <n-message-provider>
        <n-dialog-provider>
          <n-modal-provider>
            <router-view />
          </n-modal-provider>
        </n-dialog-provider>
      </n-message-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  dateZhCN,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NModalProvider,
  NNotificationProvider,
  zhCN,
} from 'naive-ui';

const themeOverrides = {
  common: {
    primaryColor: '#009688',
    primaryColorHover: '#16a99b',
    primaryColorPressed: '#00796f',
    borderRadius: '8px',
  },
  Button: {
    borderRadiusMedium: '6px',
  },
  Card: {
    borderRadius: '8px',
  },
};
</script>
