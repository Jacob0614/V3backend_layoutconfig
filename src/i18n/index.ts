import { createI18n } from 'vue-i18n';
import en from './locales/en/menu.json';
import zhTW from './locales/zh/menu.json';

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-TW',
  fallbackLocale: 'zh-TW',
  messages: {
    'zh-TW': zhTW,
    en,
  },
});
