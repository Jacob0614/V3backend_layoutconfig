<template>
  <div class="p0b-page">
    <section class="p0b-head">
      <div>
        <div class="p0b-title-row">
          <h1>H5版面配置</h1>
          <n-tag size="small" type="info" :bordered="false">P0-B</n-tag>
          <n-tag size="small" type="warning" :bordered="false">{{ status }}
          </n-tag>
        </div>
        <p>{{ merchant?.code || merchantId }}／{{ merchant?.brandName || route.query.merchantName || '商戶' }}</p>
      </div>
      <n-space size="small">
        <n-button secondary size="small" @click="openPreview">預覽 H5</n-button>
        <n-button type="primary" size="small" :disabled="!dirty" @click="saveDraft">保存草稿
        </n-button>
        <n-button type="success" size="small" :disabled="!canSubmit" @click="submitForReview">送審前驗證</n-button>
        <n-button quaternary size="small" @click="goBack">返回清單</n-button>
      </n-space>
    </section>

    <div class="p0b-layout">
      <section class="p0b-preview-column">
        <n-card size="small" class="p0b-preview-card">
          <template #header>
            <div class="p0b-card-header">
              <strong>H5 前台預覽</strong>
              <span class="p0b-muted">兩種狀態／375 × 812</span>
            </div>
          </template>
          <div ref="previewFrameRef" class="p0b-phone-wrap">
            <div class="p0b-state-grid">
              <div v-for="state in authStates" :key="state.value" class="p0b-state-preview">
                <div class="p0b-state-label">{{ state.label }}</div>
                <div class="p0b-phone-frame" :style="previewFrameStyle">
                  <div class="p0b-phone" :style="previewPhoneStyle">
                    <div class="p0b-phone-scroll">
                      <div v-for="module in previewModules" :key="`${state.value}-${module.id}`" class="p0b-source-module" :class="`p0b-source-module--${module.type}`">
                        <ModuleWireframe :module="module" platform="mobile" :template-id="selectedTemplateId" :auth-state="state.value" fidelity="low" />
                      </div>
                    </div>
                    <div class="p0b-phone-floating">
                      <ModuleWireframe :module="floatingPreviewModule" platform="mobile" :template-id="selectedTemplateId" :auth-state="state.value" fidelity="low" />
                    </div>
                    <div class="p0b-phone-fixed-bottom">
                      <ModuleWireframe :module="bottomNavPreviewModule" platform="mobile" :template-id="selectedTemplateId" :auth-state="state.value" fidelity="low" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p0b-preview-foot">
            <n-tag size="small" :type="previewPassed ? 'success' : 'warning'" :bordered="false">{{ previewPassed ? '預覽成功' : '尚未驗證' }}</n-tag>
            <span class="p0b-muted">畫布直接讀取目前商戶規格</span>
          </div>
        </n-card>
      </section>

      <section class="p0b-config-column">
        <n-card size="small" class="p0b-card p0b-config-card">
          <n-tabs v-model:value="configTab" type="line" size="small" class="p0b-config-tabs">
            <n-tab-pane name="layout" tab="版面與域名">
              <div class="p0b-config-tab-content">
                <section class="p0b-config-section">
                  <div class="p0b-section-head"><strong>模板與主題</strong><span>H5</span></div>
                  <n-form label-placement="top" size="small">
                    <n-form-item label="模板" required>
                      <n-select v-model:value="selectedTemplateId" :options="templateOptions" filterable @update:value="markDirty" />
                    </n-form-item>
                    <div v-if="currentTemplate" class="p0b-template-meta">
                      <strong>{{ currentTemplate.label }}</strong>
                      <span>站點：{{ currentTemplate.sites.join('、') || '待綁定' }}</span>
                      <span>{{ currentTemplate.structure }}</span>
                    </div>
                    <n-form-item label="主題色" required>
                      <n-select v-model:value="themeId" :options="themeOptions" filterable @update:value="markDirty" />
                    </n-form-item>
                    <div v-if="selectedTheme" class="p0b-theme-summary">
                      <span class="p0b-swatch" :style="{ background: selectedTheme.buttonColor }" />
                      <span class="p0b-swatch" :style="{ background: selectedTheme.background }" />
                      <div><strong>{{ selectedTheme.label }}</strong><span>{{ selectedTheme.designForm }}</span></div>
                    </div>
                  </n-form>
                </section>

                <section class="p0b-config-section">
                  <div class="p0b-section-head"><strong>最小域名綁定</strong><span>H5 生效域名</span></div>
                  <div class="p0b-domain-row">
                    <n-input v-model:value="domain" size="small" placeholder="例如 h5.example.com" @update:value="markDirty" />
                    <n-tag size="small" :type="domainVerified ? 'success' : 'warning'" :bordered="false">{{ domainVerified ? '已驗證' : '待驗證' }}</n-tag>
                    <n-button size="small" secondary :disabled="!domain" @click="verifyDomain">驗證</n-button>
                  </div>
                </section>
              </div>
            </n-tab-pane>

            <n-tab-pane name="venues" tab="遊戲場館">
              <div class="p0b-config-tab-content p0b-venue-tab-content">
                <section class="p0b-config-section">
                  <div class="p0b-section-head"><strong>遊戲場館</strong><n-button size="tiny" type="primary" @click="addVenue">新增場館</n-button></div>
                  <div class="p0b-helper">場館 → 子分類 → 遊戲入口</div>
                  <n-empty v-if="!venues.length" description="至少新增一個場館" size="small" />
                  <div v-for="(venue, venueIndex) in venues" :key="venue.id" class="p0b-venue-card">
                    <div class="p0b-venue-head">
                      <n-input v-model:value="venue.name" size="small" placeholder="場館名稱" @update:value="markDirty" />
                      <n-space size="small">
                        <n-button quaternary circle size="tiny" title="上移" :disabled="venueIndex === 0" @click="moveVenue(venueIndex, -1)">↑</n-button>
                        <n-button quaternary circle size="tiny" title="下移" :disabled="venueIndex === venues.length - 1" @click="moveVenue(venueIndex, 1)">↓</n-button>
                        <n-button quaternary circle size="tiny" title="刪除場館" @click="removeVenue(venueIndex)">×</n-button>
                      </n-space>
                    </div>
                    <div v-for="(subcategory, subIndex) in venue.subcategories" :key="subcategory.id" class="p0b-subcategory-row">
                      <div class="p0b-subcategory-main">
                        <n-input v-model:value="subcategory.name" size="small" placeholder="子分類名稱" @update:value="markDirty" />
                        <n-select v-model:value="subcategory.displayMode" size="small" :options="displayModeOptions" @update:value="markDirty" />
                        <n-checkbox v-model:checked="subcategory.iconVisible" @update:checked="markDirty">圖標</n-checkbox>
                      </div>
                      <div class="p0b-subcategory-actions">
                        <span>{{ subcategory.gameIds.length }} 個遊戲</span>
                        <n-button size="tiny" secondary @click="openGamePicker(venue.id, subcategory.id)">選擇遊戲</n-button>
                        <n-button quaternary circle size="tiny" :disabled="subIndex === 0" @click="moveSubcategory(venue, subIndex, -1)">↑</n-button>
                        <n-button quaternary circle size="tiny" :disabled="subIndex === venue.subcategories.length - 1" @click="moveSubcategory(venue, subIndex, 1)">↓</n-button>
                        <n-button quaternary circle size="tiny" title="刪除子分類" @click="removeSubcategory(venue, subIndex)">×</n-button>
                      </div>
                    </div>
                    <n-button dashed size="small" class="p0b-add-subcategory" @click="addSubcategory(venue)">＋新增子分類</n-button>
                  </div>
                </section>
              </div>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </section>
    </div>

    <n-modal v-model:show="gamePickerVisible" preset="card" title="選擇遊戲入口" style="width: 680px">
      <div class="p0b-game-filters">
        <n-select v-model:value="gameCategory" size="small" :options="categoryOptions" placeholder="主大類" clearable />
        <n-select v-model:value="gameProvider" size="small" :options="providerOptions" placeholder="遊戲供應商" clearable />
        <n-input v-model:value="gameKeyword" size="small" placeholder="搜尋遊戲" clearable />
        <n-button size="small" secondary @click="toggleAllFilteredGames">{{ allFilteredSelected ? '取消全選' : '全選' }}</n-button>
      </div>
      <div class="p0b-game-list">
        <label v-for="game in filteredGames" :key="game.id" class="p0b-game-option">
          <n-checkbox :checked="editingGameIds.includes(game.id)" @update:checked="(checked) => toggleGame(game.id, checked)" />
          <span>{{ game.name }}</span><small>{{ game.providerName }}</small>
        </label>
        <n-empty v-if="!filteredGames.length" description="沒有符合的遊戲" size="small" />
      </div>
      <template #footer>
        <n-space justify="end"><n-button @click="gamePickerVisible = false">完成選擇</n-button></n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="previewVisible" preset="card" title="H5前台預覽" style="width: min(820px, calc(100vw - 32px))">
      <div class="p0b-modal-preview">
        <div class="p0b-modal-state-grid">
          <div v-for="state in authStates" :key="state.value" class="p0b-state-preview">
            <div class="p0b-state-label">{{ state.label }}</div>
            <div class="p0b-phone-frame p0b-phone-frame--modal">
              <div class="p0b-phone" :style="modalPhoneStyle">
                <div class="p0b-phone-scroll">
                  <div v-for="module in previewModules" :key="`${state.value}-${module.id}`" class="p0b-source-module" :class="`p0b-source-module--${module.type}`">
                    <ModuleWireframe :module="module" platform="mobile" :template-id="selectedTemplateId" :auth-state="state.value" fidelity="high" />
                  </div>
                </div>
                <div class="p0b-phone-floating">
                  <ModuleWireframe :module="floatingPreviewModule" platform="mobile" :template-id="selectedTemplateId" :auth-state="state.value" fidelity="high" />
                </div>
                <div class="p0b-phone-fixed-bottom">
                  <ModuleWireframe :module="bottomNavPreviewModule" platform="mobile" :template-id="selectedTemplateId" :auth-state="state.value" fidelity="high" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer><n-space justify="end"><n-button type="primary" @click="confirmPreview">預覽成功</n-button></n-space></template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NCheckbox, NEmpty, NForm, NFormItem, NInput, NModal, NSelect, NSpace, NTabPane, NTabs, NTag, useMessage } from 'naive-ui';
import { getMerchantSeed } from './data';
import ModuleWireframe from './ModuleWireframe.vue';
import { themeCatalog } from './themeCatalog';
import topNav01Source from '../../../assets/topnav/Topnav-01.svg';
import topNav02Source from '../../../assets/topnav/Topnav-02.svg';
import topNav03Source from '../../../assets/topnav/Topnav-03.svg';
import topNav04Source from '../../../assets/topnav/Topnav-04.svg';
import topNav05Source from '../../../assets/topnav/Topnav-05.svg';
import topNav06Source from '../../../assets/topnav/Topnav-06.svg';
import topNav07Source from '../../../assets/topnav/Topnav-07.svg';

type DisplayMode = 'iconText' | 'icon' | 'text';
type AuthState = 'loggedOut' | 'loggedIn';
interface H5Template { id: string; label: string; shortLabel: string; sites: string[]; structure: string }
interface GameEntry { id: string; name: string; providerId: string; providerName: string; categoryId: string; available: boolean }
interface Subcategory { id: string; name: string; displayMode: DisplayMode; iconVisible: boolean; gameIds: string[] }
interface Venue { id: string; name: string; subcategories: Subcategory[] }
interface PreviewModule {
  id: string;
  type: string;
  variant: string;
  label: string;
  detail: string;
  sourceVariant?: string;
  gameVenues?: Venue[];
  noticeIconKey?: string;
  ratio?: string;
  entryDisplayMode?: DisplayMode;
  iconVisible?: boolean;
  referenceAsset?: string;
  buttonKeys?: string[];
  primaryButton?: 'login' | 'register';
  showAuthBar?: boolean;
  bottomNavItems?: Array<{ key: string; label: string; activeIconKey: string; inactiveIconKey: string }>;
}

const route = useRoute();
const router = useRouter();
const message = useMessage();
const merchantId = String(route.params.tenantId || '');
const merchant = computed(() => getMerchantSeed(merchantId));
const storageKey = `p0b-h5-config:${merchantId}`;

const h5Templates: H5Template[] = [
  { id: 'redHome', label: 'redHome／品牌 Lobby', shortLabel: '品牌 Lobby', sites: ['AR003', 'AR012', 'AR013', 'AR036'], structure: '品牌導航 → Banner → 公告 → RedHome GameList → BigAward → Winner／Rank → Footer' },
  { id: 'public6Home', label: 'public6Home／個人資訊 Lobby', shortLabel: '個人資訊', sites: ['AR092'], structure: '下載推廣條（含品牌操作列） → Banner → 公告 → 個人資訊 → Game → BigAward／Winner／Rank' },
  { id: 'blackGoldHome', label: 'blackGoldHome／黑金 Lobby', shortLabel: '黑金 Lobby', sites: ['AR016', 'AR055', 'AR097'], structure: '導航 → Banner → 公告 → 會員資訊 → Game → Winner／Rank' },
  { id: 'blueHome', label: 'blueHome／八類入口 Lobby', shortLabel: '八類入口', sites: ['AR007', 'AR015', 'AR022', 'AR033', 'AR035', 'AR037', 'AR047', 'AR059'], structure: '導航 → Banner → 八類入口 → GameList → Winner／Rank' },
  { id: 'ar004', label: 'ar004／BlueHome 變體', shortLabel: 'BlueHome', sites: ['AR004'], structure: '導航 → Banner → Notice → GameMenu → GameList' },
  { id: 'red92Home', label: 'red92Home／92 Lobby', shortLabel: '92 Lobby', sites: ['AR001', 'AR040', 'AR043', 'AR044', 'AR045', 'AR046'], structure: '導航 → Banner → 公告 → 場館 → 遊戲展示' },
  { id: 'whiteGoldHome', label: 'whiteGoldHome／白金 Lobby', shortLabel: '白金 Lobby', sites: ['AR042'], structure: '導航 → 登入提示 → Banner → GameMenu → GameContainer' },
  { id: 'whiteGoldBigMumbai', label: 'whiteGoldBigMumbai／白金 BigMumbai', shortLabel: '白金 BigMumbai', sites: ['AR041'], structure: '導航 → 登入提示 → Banner → 公告 → GameMenu → BigMumbai' },
  { id: 'electronic', label: 'electronic／電子遊戲型', shortLabel: '電子遊戲型', sites: ['AR019', 'AR023', 'AR031', 'AR039', 'AR070', 'AR071', 'AR074', 'AR081', 'AR082', 'AR086'], structure: '導航 → Banner → 公告 → 分類頁籤 → 遊戲分段' },
  { id: 'blackElectronic', label: 'blackElectronic／黑電子變體', shortLabel: '黑電子', sites: ['AR038'], structure: '導航 → Banner → 公告 → 分類頁籤 → Slot／Video／遊戲' },
  { id: 'red096Home', label: 'red096Home／Menu 電子型', shortLabel: 'Menu 電子型', sites: ['AR096'], structure: '導航 → Banner → 公告 → MenuItem → 遊戲分段' },
  { id: 'damanHome', label: 'damanHome／Daman 場景型', shortLabel: 'Daman 場景', sites: ['AR002', 'AR011', 'AR050', 'AR051', 'AR052'], structure: '導航 → Banner → 公告 → 場景分類 → Winner／Rank' },
  { id: 'goGameHome', label: 'goGameHome／GO Game 場景型', shortLabel: 'GO Game', sites: ['AR009', 'AR026', 'AR068'], structure: 'GO Game 導航 → Banner → 公告 → 場景分類' },
  { id: 'public3Home', label: 'public3Home／公版三', shortLabel: '公版三', sites: ['AR034', 'AR058', 'AR062', 'AR065', 'AR067', 'AR069', 'AR072', 'AR076', 'AR078', 'AR080', 'AR085', 'AR087', 'AR089', 'AR090', 'AR098'], structure: '導航 → 側邊導航 → Banner → 公告 → 快捷卡 → Winner／Rank／BigAward → GameList → Team' },
  { id: 'okwinHome2', label: 'okwinHome2／Okwin', shortLabel: 'Okwin', sites: ['AR064', 'AR077'], structure: '導航 → Banner → 公告 → 錢包／快捷 → GameList → Winner／Rank → Team' },
  { id: 'public5BlackGoldHome', label: 'public5BlackGoldHome／黑金', shortLabel: '公版黑金', sites: ['AR079', 'AR088', 'AR091'], structure: '導航 → Banner → 公告 → Winner → Game → Rank' },
  { id: 'rajaHome', label: 'rajaHome／Raja', shortLabel: 'Raja', sites: ['AR008'], structure: '導航 → 公告 → Banner → Game → BigAward → Winner／Rank' },
  { id: '91club', label: '91club／Club Lobby', shortLabel: 'Club Lobby', sites: ['AR021', 'AR048'], structure: '導航 → 公告 → Banner → 品牌快捷 → Game' },
  { id: 'ar014', label: 'ar014／Club 變體', shortLabel: 'Club 變體', sites: ['AR014'], structure: '導航 → 公告 → Banner → 品牌快捷 → Game' },
  { id: 'public5WhiteGreenHome', label: 'public5WhiteGreenHome／白綠 Lobby', shortLabel: '白綠 Lobby', sites: ['AR095'], structure: '導航 → 登入／註冊 → 公告 → Banner → 活動 → GameList' },
  { id: 'public7Home', label: 'public7Home／Public7 Lobby', shortLabel: 'Public7 Lobby', sites: ['AR093'], structure: '導航 → Banner → 公告 → 分類頁籤 → GameSection → Partner' },
];

const templateOptions = h5Templates.map((item) => ({ label: item.label, value: item.id }));
const themeOptions = themeCatalog.map((item) => ({ label: item.label, value: item.id }));
const merchantSite = merchant.value?.code?.toLowerCase() || '';
const initialTemplate = merchant.value?.publishedTemplateByPlatform.mobile || 'redHome';
const defaultTheme = themeCatalog.find((theme) => theme.sites.includes(merchantSite))?.id || themeCatalog[0]?.id || 'redStyle';
const selectedTemplateId = ref(initialTemplate);
const themeId = ref(defaultTheme);
const status = ref('草稿');
const dirty = ref(true);
const previewPassed = ref(false);
const domain = ref(`${merchantSite || 'merchant'}.example.com`);
const domainVerified = ref(false);
const previewVisible = ref(false);
const configTab = ref<'layout' | 'venues'>('layout');
const activeVenueId = ref('casino');
const activeSubcategoryId = ref('popular');
const previewFrameRef = ref<HTMLElement | null>(null);
const previewScale = ref(1);
let previewResizeObserver: ResizeObserver | undefined;
const authStates = [{ value: 'loggedOut' as const, label: '登入前' }, { value: 'loggedIn' as const, label: '登入後' }];
const bottomNavItems = ['首頁', '遊戲', '活動', '錢包', '會員'];
const displayModeOptions = [{ label: '圖示＋文字', value: 'iconText' }, { label: '純圖示', value: 'icon' }, { label: '純文字', value: 'text' }];

const gameCatalog: GameEntry[] = Array.from({ length: 48 }, (_, index) => {
  const providers = [{ id: 'pg', name: 'PG Soft', categoryId: 'casino' }, { id: 'jdb', name: 'JDB', categoryId: 'slots' }, { id: 'evo', name: 'Evolution', categoryId: 'live' }, { id: 'lottery', name: 'Lottery Core', categoryId: 'lottery' }];
  const provider = providers[index % providers.length];
  return { id: `game-${String(index + 1).padStart(3, '0')}`, name: `${provider.name} 遊戲 ${String(index + 1).padStart(3, '0')}`, providerId: provider.id, providerName: provider.name, categoryId: provider.categoryId, available: index !== 11 };
});
const categoryOptions = [{ label: 'Casino', value: 'casino' }, { label: '電子', value: 'slots' }, { label: '真人', value: 'live' }, { label: '彩票', value: 'lottery' }];
const providerOptions = [{ label: 'PG Soft', value: 'pg' }, { label: 'JDB', value: 'jdb' }, { label: 'Evolution', value: 'evo' }, { label: 'Lottery Core', value: 'lottery' }];
const venues = ref<Venue[]>([
  { id: 'casino', name: 'Casino', subcategories: [{ id: 'popular', name: '熱門', displayMode: 'iconText', iconVisible: true, gameIds: ['game-001', 'game-002', 'game-003'] }, { id: 'new', name: '新上架', displayMode: 'iconText', iconVisible: true, gameIds: ['game-004', 'game-005'] }] },
  { id: 'sports', name: '體育', subcategories: [{ id: 'sports-main', name: '體育入口', displayMode: 'iconText', iconVisible: true, gameIds: ['game-009', 'game-010'] }] },
]);
type PreviewDefinition = Omit<PreviewModule, 'id' | 'gameVenues'>;
// Keep the source number separate from the renderer. Several products share
// a numbered SVG but still have a distinct source-specific navigation shape.
const previewTopNavSourceVariantByTemplate: Record<string, string> = {
  redHome: 'topnav01', public6Home: 'topnav05', blackGoldHome: 'topnav03', blueHome: 'topnav01', ar004: 'topnav01',
  red92Home: 'topnav03', whiteGoldHome: 'topnav01', whiteGoldBigMumbai: 'topnav01', electronic: 'topnav06', blackElectronic: 'topnav04',
  red096Home: 'topnav04', damanHome: 'topnav02', goGameHome: 'topnav06', public3Home: 'topnav04', okwinHome2: 'topnav06',
  public5BlackGoldHome: 'topnav03', rajaHome: 'topnav02', '91club': 'topnav02', ar014: 'topnav02',
  public5WhiteGreenHome: 'topnav05', public7Home: 'topnav07',
};
const previewTopNavReferenceAssetByVariant: Record<string, string> = {
  topnav01: topNav01Source,
  topnav02: topNav02Source,
  topnav03: topNav03Source,
  topnav04: topNav04Source,
  topnav05: topNav05Source,
  topnav06: topNav06Source,
  topnav07: topNav07Source,
};
const previewTopNavButtonsByTemplate: Record<string, string[]> = {
  public7Home: ['wallet', 'download', 'language'],
  electronic: ['download', 'customerService'],
  red096Home: ['download', 'customerService'],
  okwinHome2: ['download', 'language'],
  blackGoldHome: ['download', 'customerService', 'language'],
  damanHome: ['notification'],
  public5WhiteGreenHome: ['notification', 'download'],
  public5BlackGoldHome: ['download'],
  blackElectronic: ['download', 'customerService'],
  '91club': ['download'],
  rajaHome: ['notification', 'customerService'],
  ar014: ['notification', 'customerService'],
  goGameHome: [],
  default: ['notification', 'download'],
};
const bannerRatioByTemplate: Record<string, string> = {
  redHome: '351:160',
  public6Home: '351:160',
  blackGoldHome: '702:287',
  blueHome: '351:160',
  ar004: '351:160',
  red92Home: '375:169',
  whiteGoldHome: '351:190',
  whiteGoldBigMumbai: '351:190',
  electronic: '69:38',
  blackElectronic: '69:38',
  red096Home: '69:38',
  damanHome: '351:160',
  goGameHome: '672:317',
  public3Home: '23:10',
  okwinHome2: '43:20',
  public5BlackGoldHome: '702:287',
  rajaHome: '351:160',
  '91club': '351:160',
  ar014: '351:160',
  public5WhiteGreenHome: '117:50',
  public7Home: '138:59',
};
const previewBottomNavVariantByTemplate: Record<string, string> = {
  redHome: 'index', damanHome: 'index', red92Home: 'index', ar004: 'index', blueHome: 'index', whiteGoldHome: 'index',
  whiteGoldBigMumbai: 'index', goGameHome: 'index', public6Home: 'index', public5WhiteGreenHome: 'ar095', public7Home: 'ar093',
  blackGoldHome: 'index3', electronic: 'index4', blackElectronic: 'index4', red096Home: 'ar096', public3Home: 'index2',
  okwinHome2: 'ar064', public5BlackGoldHome: 'index7', rajaHome: 'rajaTab', '91club': '91club', ar014: 'index2',
};
const previewLayoutByTemplate: Record<string, PreviewDefinition[]> = {
  redHome: [
    ['topNav', 'dualAuth', '頂部導航', 'NavBar'], ['banner', 'redHome', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['games', 'redHome', '遊戲展示', 'RedHome GameList／熱門與分類'], ['info', 'bigAward', 'Super Jackpot', 'BigAward'],
    ['info', 'winner', '中獎資訊', 'LuckyWinners'], ['info', 'rank', '排行榜', 'DailyProfitRank'], ['footer', 'legal', 'Footer', 'BottomLogoText'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  public6Home: [
    // The download bar already contains the source brand/action row; do not add a second top navigation.
    ['screenBanner', 'public6DownloadBar', '頂部下載橫幅', 'Download promotion + brand actions'],
    ['banner', 'ratioSwiper', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'], ['info', 'person', '會員資訊', 'PersonCenterInfoBar'],
    ['games', 'public6', '遊戲展示', 'Public6 GameList'], ['info', 'bigAward', 'Super Jackpot', 'BigAward（條件式）'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  blackGoldHome: [
    ['topNav', 'wideLogo', '頂部導航', 'Login／Language'], ['banner', 'hero', 'Banner', 'Hero'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['info', 'person', '會員資訊', 'Login state'], ['games', 'blackGold', '遊戲展示', 'BlackGold Game／內含分類'], ['info', 'winner', '中獎資訊', 'LuckyWinners'], ['info', 'rank', '排行榜', 'DailyProfitRank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  blueHome: [
    ['topNav', 'dualAuth', '頂部導航', 'NavBar'], ['banner', 'fullBleed', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['category', 'blueMenu', '場館入口', 'BlueHome 八類入口'], ['games', 'blueHome', '遊戲展示', 'BlueHome GamesList'], ['info', 'winner', '中獎資訊', 'LuckyWinners'], ['info', 'rank', '排行榜', 'DailyProfitRank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  ar004: [
    ['topNav', 'dualAuth', '頂部導航', 'NavBar'], ['banner', 'ratioSwiper', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['category', 'blueMenu', '場館入口', 'ar004 GameMenu'], ['games', 'blueHome', '遊戲展示', 'ar004 GamesList'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  red92Home: [
    ['topNav', 'wideLogo', '頂部導航', 'NavBar'], ['banner', 'ratioSwiper', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['category', 'red92Menu', '場館入口', 'HomeMenu'], ['games', 'red92', '遊戲展示', 'HomeContainer'], ['info', 'red92Winner', '中獎資訊', 'LuckyWinners'], ['info', 'red92Rank', '排行榜', 'DailyProfitRank'], ['footer', 'legal', 'Footer', 'BottomLogoText'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  whiteGoldHome: [
    ['topNav', 'dualAuth', '頂部導航', 'NavBar'], ['function', 'loginTip', '登入提示', 'LoginTip'], ['banner', 'hero', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['category', 'containerMenu', '場館入口', 'GameMenu'], ['games', 'container', '遊戲展示', 'GameContainer'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  whiteGoldBigMumbai: [
    ['topNav', 'dualAuth', '頂部導航', 'NavBar'], ['function', 'loginTip', '登入提示', 'LoginTip'], ['banner', 'cardCarousel', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['category', 'containerMenu', '場館入口', 'GameMenu'], ['games', 'bigMumbai', '遊戲展示', 'BigMumbai GameContainer'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  electronic: [
    ['topNav', 'topnav06', '頂部導航', 'Electronic Nav'], ['banner', 'fullBleed', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'Electronic Notice'],
    ['category', 'tabs', '場館入口', 'Tabs'], ['games', 'electronic', '遊戲展示', 'AloneGame／Slot／Video'], ['info', 'winning', '中獎資訊', 'Winning／Profit'], ['info', 'instructions', '遊戲說明', 'Instructions'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  blackElectronic: [
    ['topNav', 'wideLogo', '頂部導航', 'Electronic Nav'], ['banner', 'ratioSwiper', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'Notice'],
    ['category', 'tabs', '場館入口', 'Tabs'], ['games', 'electronic', '遊戲展示', 'Slot／Video／AloneGame'], ['info', 'bigAward', 'Super Jackpot', 'BigAward'], ['info', 'winning', '中獎資訊', 'Winning／Profit'], ['info', 'instructions', '遊戲說明', 'Instructions'], ['footer', 'legal', 'Footer', 'BottomLogoText'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  red096Home: [
    ['topNav', 'wideLogo', '頂部導航', 'Menu Nav'], ['banner', 'fullBleed', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'Notice'],
    ['category', 'menuItem', '場館入口', 'MenuItem'], ['games', 'electronic', '遊戲展示', 'AloneGame'], ['info', 'winning', '中獎資訊', 'Winning／Profit'], ['info', 'instructions', '遊戲說明', 'Instructions'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  damanHome: [
    ['topNav', 'dualAuth', '頂部導航', 'Daman Nav'], ['banner', 'daman', 'Banner', 'Daman Swiper'], ['notice', 'daman', '公告提示', 'NoticeDaman'],
    ['category', 'scene', '場館入口', 'GameScenesDaman'], ['games', 'daman', '遊戲展示', 'GameScenesDaman'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'], ['footer', 'terms', 'Footer', 'TermsDaman'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  goGameHome: [
    ['topNav', 'goGame', '頂部導航', 'GO Game Nav'], ['banner', 'goGame', 'Banner', 'GO Game Swiper'], ['notice', 'daman', '公告提示', 'NoticeDaman'],
    ['category', 'scene', '場館入口', 'GameScenesDamanNew'], ['games', 'goGame', '遊戲展示', 'GameScenesDamanNew／Home'], ['footer', 'terms', 'Footer', 'TermsDamanNew'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  public3Home: [
    ['topNav', 'wideLogo', '頂部導航', 'Search／Wallet／通知／會員'], ['function', 'sideNav', 'PC 側邊導航', '固定入口'], ['banner', 'fullBleed', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'],
    ['function', 'quickActions', '首頁快捷入口', 'Shortcut cards'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'], ['info', 'bigAward', 'Super Jackpot', 'BigAward'], ['games', 'public3', '遊戲展示', 'Public3 GameList'], ['footer', 'team', 'Footer', 'Team'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  okwinHome2: [
    ['topNav', 'topnav06', '頂部導航', 'Okwin Nav'], ['banner', 'okwin', 'Banner', 'Okwin Swiper'], ['notice', 'bar', '公告列', 'Notice'], ['function', 'walletActions', '錢包快捷', 'Wallet／VIP'],
    ['games', 'okwin', '遊戲展示', 'Okwin GameList／內含分類'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'], ['footer', 'team', 'Footer', 'Team'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  public5BlackGoldHome: [
    ['topNav', 'wideLogo', '頂部導航', 'NavBar'], ['banner', 'hero', 'Banner', 'Hero'], ['notice', 'bar', '公告列', 'NoticeBar'], ['info', 'winner', '中獎資訊', 'Winner'],
    ['games', 'public5BlackGold', '遊戲展示', 'Public5BlackGold Game'], ['info', 'rank', '排行榜', 'Rank'], ['footer', 'team', 'Footer', 'Team'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  rajaHome: [
    ['topNav', 'topnav02', '頂部導航', 'Raja Nav'], ['notice', 'bar', '公告列', 'NoticeBar'], ['banner', 'cardCarousel', 'Banner', 'Swiper'], ['games', 'raja', '遊戲展示', 'Raja Game／內含分類'], ['info', 'bigAward', 'Super Jackpot', 'BigAward'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'], ['footer', 'team', 'Footer', 'Team'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  '91club': [
    ['topNav', 'topnav02', '頂部導航', 'Club Nav'], ['notice', 'bar', '公告列', 'NoticeBar'], ['banner', 'cardCarousel', 'Banner', 'Swiper'], ['function', 'quickActions', '品牌快捷入口', '客服／充值／提款／VIP'], ['games', 'club91', '遊戲展示', 'Club Game／內含分類'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'], ['footer', 'team', 'Footer', 'Team'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  ar014: [
    ['topNav', 'topnav02', '頂部導航', 'Club Nav'], ['notice', 'bar', '公告列', 'NoticeBar'], ['banner', 'ratioSwiper', 'Banner', 'Swiper'], ['function', 'quickActions', '品牌快捷入口', '客服／充值／提款／VIP'], ['games', 'ar014', '遊戲展示', 'ar014 Game／內含分類'], ['info', 'winner', '中獎資訊', 'Winner'], ['info', 'rank', '排行榜', 'Rank'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  public5WhiteGreenHome: [
    ['topNav', 'topnav05', '頂部導航', 'Nav／Login／Register'], ['function', 'loginCta', '登入／註冊入口', 'Login／Register'], ['notice', 'bar', '公告列', 'NoticeBar'], ['banner', 'fullBleed', 'Banner', 'Swiper'], ['function', 'activityCards', '活動入口', 'ActivityCards'], ['games', 'public5WhiteGreen', '遊戲展示', 'GameList'], ['footer', 'terms', 'Footer', 'Terms'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
  public7Home: [
    ['topNav', 'topnav07', '頂部導航', 'Fixed Nav'], ['banner', 'fullBleed', 'Banner', 'Swiper'], ['notice', 'bar', '公告列', 'NoticeBar'], ['category', 'tabs', '場館入口', 'GameCategoryTabs'],
    ['games', 'gameSection', '遊戲展示', 'GameSection'], ['games', 'recommended', '推薦遊戲', 'RecommendedGames'], ['games', 'featured', '特色遊戲', 'FeaturedGame'], ['info', 'winner', '中獎資訊', 'LuckyWinners'], ['info', 'rank', '排行榜', 'Rank'], ['footer', 'partner', 'Footer', 'PartnerLogos'],
  ].map(([type, variant, label, detail]) => ({ type, variant, label, detail })),
};
const currentTemplate = computed(() => h5Templates.find((item) => item.id === selectedTemplateId.value));
const selectedTheme = computed(() => themeCatalog.find((item) => item.id === themeId.value));
const activeVenue = computed(() => venues.value.find((venue) => venue.id === activeVenueId.value) || venues.value[0]);
const activeSubcategory = computed(() => activeVenue.value?.subcategories.find((item) => item.id === activeSubcategoryId.value) || activeVenue.value?.subcategories[0]);
const previewBannerRatio = computed(() => {
  // AR088's source banner is explicitly documented as 690 x 300 (23:10).
  if ((merchant.value?.code === 'AR002' || merchant.value?.name === 'AR088') && selectedTemplateId.value === 'public5BlackGoldHome') return '23:10';
  return bannerRatioByTemplate[selectedTemplateId.value] || '351:160';
});
const previewModules = computed<PreviewModule[]>(() => {
  const definitions = previewLayoutByTemplate[selectedTemplateId.value] || previewLayoutByTemplate.redHome;
  const topNavSourceVariant = previewTopNavSourceVariantByTemplate[selectedTemplateId.value] || 'topnav01';
  const topNavButtons = previewTopNavButtonsByTemplate[selectedTemplateId.value] || previewTopNavButtonsByTemplate.default;
  return definitions.map((item, index) => ({
    ...item,
    // The numbered source form is the canonical top-nav shape. Product
    // labels remain in the template catalog, but the canvas always renders
    // the mapped source form instead of an invented variant.
    variant: item.type === 'topNav' ? topNavSourceVariant : item.variant,
    sourceVariant: item.type === 'topNav' ? topNavSourceVariant : undefined,
    referenceAsset: item.type === 'topNav' ? previewTopNavReferenceAssetByVariant[topNavSourceVariant] : undefined,
    id: `preview-${selectedTemplateId.value}-${item.type}-${item.variant}-${index}`,
    gameVenues: venues.value,
    noticeIconKey: 'notice',
    ratio: item.type === 'banner' ? previewBannerRatio.value : undefined,
    label: item.type === 'category'
      ? ['tabs', 'menuItem'].includes(item.variant) ? '遊戲分類' : '場館入口'
      : item.type === 'games' ? '遊戲展示' : item.label,
    entryDisplayMode: item.type === 'category' ? 'iconText' : undefined,
    iconVisible: item.type === 'category' ? true : undefined,
    buttonKeys: item.type === 'topNav' ? topNavButtons : undefined,
    primaryButton: item.type === 'topNav' && topNavSourceVariant === 'topnav02' ? 'register' : 'login',
    showAuthBar: item.type === 'topNav' && topNavSourceVariant === 'topnav04',
  }));
});
const floatingPreviewModule = computed<PreviewModule>(() => ({
  id: `preview-floating-${selectedTemplateId.value}`,
  type: 'floating',
  variant: 'fixedEntries',
  label: '浮標入口',
  detail: '固定入口／靠近畫面邊緣',
}));
const bottomNavPreviewModule = computed<PreviewModule>(() => ({
  id: `preview-bottom-nav-${selectedTemplateId.value}`,
  type: 'bottomNav',
  variant: previewBottomNavVariantByTemplate[selectedTemplateId.value] || 'index',
  label: '底部導航',
  detail: 'H5固定底部導航',
  bottomNavItems: bottomNavItems.map((label, index) => ({
    key: ['home', 'games', 'promotion', 'wallet', 'main'][index],
    label,
    activeIconKey: ['home-filled', 'games-filled', 'promotion-filled', 'wallet-filled', 'main-filled'][index],
    inactiveIconKey: ['home-outline', 'games-outline', 'promotion-outline', 'wallet-outline', 'main-outline'][index],
  })),
}));
const previewStyle = computed(() => ({
  '--p0b-primary': selectedTheme.value?.buttonColor || '#009688',
  '--p0b-background': selectedTheme.value?.background || '#f7f8ff',
  '--fc-theme-primary': selectedTheme.value?.buttonColor || '#009688',
  '--fc-theme-background': selectedTheme.value?.background || '#f7f8ff',
  '--fc-theme-primary-button': selectedTheme.value?.primaryButton || selectedTheme.value?.buttonColor || '#009688',
}));
const previewFrameStyle = computed(() => ({ '--p0b-scale': String(previewScale.value) }));
const previewPhoneStyle = computed(() => ({ ...previewStyle.value, '--p0b-scale': String(previewScale.value) }));
const modalPhoneStyle = computed(() => ({ ...previewStyle.value, '--p0b-scale': '1' }));
const canSubmit = computed(() => !dirty.value && previewPassed.value && Boolean(selectedTemplateId.value && themeId.value && venues.value.length && venues.value.every((venue) => venue.name && venue.subcategories.length && venue.subcategories.every((item) => item.name && item.gameIds.length))));

const gamePickerVisible = ref(false);
const editingVenueId = ref('');
const editingSubcategoryId = ref('');
const editingGameIds = ref<string[]>([]);
const gameCategory = ref<string | null>(null);
const gameProvider = ref<string | null>(null);
const gameKeyword = ref('');
const filteredGames = computed(() => gameCatalog.filter((game) => game.available && (!gameCategory.value || game.categoryId === gameCategory.value) && (!gameProvider.value || game.providerId === gameProvider.value) && (!gameKeyword.value || game.name.toLowerCase().includes(gameKeyword.value.toLowerCase()))));
const allFilteredSelected = computed(() => filteredGames.value.length > 0 && filteredGames.value.every((game) => editingGameIds.value.includes(game.id)));

function markDirty() { dirty.value = true; previewPassed.value = false; status.value = '草稿'; }
function selectVenue(venue: Venue) { activeVenueId.value = venue.id; activeSubcategoryId.value = venue.subcategories[0]?.id || ''; }
function selectSubcategory(subcategoryId: string) { activeSubcategoryId.value = subcategoryId; }
function addVenue() { const id = `venue-${Date.now()}`; venues.value.push({ id, name: '新場館', subcategories: [{ id: `${id}-subcategory`, name: '新子分類', displayMode: 'iconText', iconVisible: true, gameIds: [] }] }); activeVenueId.value = id; markDirty(); }
function removeVenue(index: number) { venues.value.splice(index, 1); activeVenueId.value = venues.value[0]?.id || ''; markDirty(); }
function moveVenue(index: number, offset: number) { const target = index + offset; if (target < 0 || target >= venues.value.length) return; const [item] = venues.value.splice(index, 1); venues.value.splice(target, 0, item); activeVenueId.value = item.id; markDirty(); }
function addSubcategory(venue: Venue) { venue.subcategories.push({ id: `${venue.id}-subcategory-${Date.now()}`, name: '新子分類', displayMode: 'iconText', iconVisible: true, gameIds: [] }); markDirty(); }
function removeSubcategory(venue: Venue, index: number) { venue.subcategories.splice(index, 1); markDirty(); }
function moveSubcategory(venue: Venue, index: number, offset: number) { const target = index + offset; if (target < 0 || target >= venue.subcategories.length) return; const [item] = venue.subcategories.splice(index, 1); venue.subcategories.splice(target, 0, item); activeSubcategoryId.value = item.id; markDirty(); }
function openGamePicker(venueId: string, subcategoryId: string) { const venue = venues.value.find((item) => item.id === venueId); const subcategory = venue?.subcategories.find((item) => item.id === subcategoryId); if (!subcategory) return; editingVenueId.value = venueId; editingSubcategoryId.value = subcategoryId; editingGameIds.value = [...subcategory.gameIds]; gameCategory.value = null; gameProvider.value = null; gameKeyword.value = ''; gamePickerVisible.value = true; }
function toggleGame(gameId: string, checked: boolean) { editingGameIds.value = checked ? [...new Set([...editingGameIds.value, gameId])] : editingGameIds.value.filter((id) => id !== gameId); const venue = venues.value.find((item) => item.id === editingVenueId.value); const subcategory = venue?.subcategories.find((item) => item.id === editingSubcategoryId.value); if (subcategory) { subcategory.gameIds = [...editingGameIds.value]; markDirty(); } }
function toggleAllFilteredGames() { const shouldSelect = !allFilteredSelected.value; filteredGames.value.forEach((game) => toggleGame(game.id, shouldSelect)); }
function verifyDomain() { domainVerified.value = true; markDirty(); message.success('H5域名格式已記錄，正式驗證由後端接口完成。'); }
function openPreview() { previewVisible.value = true; }
function confirmPreview() { if (!venues.value.length || venues.value.some((venue) => !venue.subcategories.some((item) => item.gameIds.length))) { message.warning('請至少完成一個場館、子分類與遊戲入口。'); return; } previewPassed.value = true; previewVisible.value = false; message.success('H5預覽驗證成功。'); }
function saveDraft() { localStorage.setItem(storageKey, JSON.stringify({ templateId: selectedTemplateId.value, themeId: themeId.value, venues: venues.value, domain: domain.value, savedAt: new Date().toISOString() })); dirty.value = false; status.value = '草稿已保存'; message.success('H5草稿已保存。'); }
function submitForReview() { if (!canSubmit.value) { message.warning('請先保存草稿並完成H5預覽驗證。'); return; } status.value = '待審批'; message.success('H5配置已完成送審前驗證。'); }
function goBack() { router.push({ name: 'config_layoutConfig' }); }

function syncPreviewScale() {
  const frame = previewFrameRef.value;
  if (!frame) return;
  const widthPerState = Math.max(0, (frame.clientWidth - 28) / authStates.length);
  previewScale.value = Math.min(widthPerState / 375, frame.clientHeight / 812, 1);
}

onMounted(() => {
  void nextTick(() => {
    syncPreviewScale();
    if (!previewFrameRef.value) return;
    previewResizeObserver = new ResizeObserver(syncPreviewScale);
    previewResizeObserver.observe(previewFrameRef.value);
  });
});

onBeforeUnmount(() => previewResizeObserver?.disconnect());
</script>

<style scoped>
.p0b-page { display: flex; max-width: 1600px; height: calc(100vh - 112px); min-height: 0; margin: 0 auto; flex-direction: column; overflow: hidden; color: #1f2937; }
.p0b-head { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 8px; }
.p0b-muted, .p0b-helper, .p0b-template-meta span, .p0b-preview-foot { color: #6b7280; font-size: 12px; }
.p0b-title-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.p0b-title-row h1 { margin: 0; font-size: 20px; }
.p0b-head p { margin: 5px 0 0; color: #6b7280; font-size: 13px; }
.p0b-layout { display: grid; min-height: 0; flex: 1 1 auto; grid-template-columns: minmax(440px, 1.08fr) minmax(390px, 0.92fr); gap: 12px; align-items: stretch; overflow: hidden; }
.p0b-preview-column, .p0b-config-column { min-height: 0; }
.p0b-config-column { min-width: 0; overflow: hidden; padding-right: 2px; }
.p0b-preview-card, .p0b-card { border-radius: 4px; }
.p0b-config-card { display: flex; height: 100%; min-height: 0; flex-direction: column; }
.p0b-config-card :deep(.n-card__content) { display: flex; min-height: 0; flex: 1 1 auto; flex-direction: column; padding: 0 14px 12px; overflow: hidden; }
.p0b-config-tabs { display: flex; min-height: 0; flex: 1 1 auto; flex-direction: column; }
.p0b-config-tabs :deep(.n-tabs-nav) { flex: 0 0 auto; }
.p0b-config-tabs :deep(.n-tab-pane) { height: 100%; min-height: 0; padding-top: 8px; overflow: auto; }
.p0b-config-tab-content { display: grid; gap: 12px; }
.p0b-config-section { min-width: 0; padding-bottom: 12px; border-bottom: 1px solid #eef2f3; }
.p0b-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; color: #1f2937; font-size: 13px; }
.p0b-section-head > span { color: #94a3b8; font-size: 11px; }
.p0b-venue-tab-content { min-height: 100%; }
.p0b-venue-tab-content .p0b-config-section { padding-bottom: 0; border-bottom: 0; }
.p0b-preview-card { display: flex; height: 100%; flex-direction: column; }
.p0b-preview-card :deep(.n-card-content) { display: flex; min-height: 0; flex: 1 1 auto; flex-direction: column; overflow: hidden; }
.p0b-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.p0b-phone-wrap { display: flex; min-height: 0; flex: 1 1 auto; align-items: center; justify-content: center; overflow: hidden; padding: 8px 0; }
.p0b-state-grid, .p0b-modal-state-grid { display: flex; min-width: 0; min-height: 0; align-items: flex-start; justify-content: center; gap: 14px; }
.p0b-state-preview { display: grid; min-width: 0; min-height: 0; justify-items: center; gap: 5px; }
.p0b-state-label { color: #475569; font-size: 11px; font-weight: 600; white-space: nowrap; }
.p0b-phone-frame { position: relative; width: calc(375px * var(--p0b-scale, 1)); height: calc(812px * var(--p0b-scale, 1)); flex: 0 0 auto; overflow: hidden; }
.p0b-phone-frame--modal { width: 375px; height: 812px; flex: 0 0 375px; }
.p0b-phone { position: relative; width: 375px; height: 812px; overflow: hidden; border: 7px solid #202a33; border-radius: 24px; background: var(--p0b-background); box-shadow: 0 10px 25px rgb(15 23 42 / 14%); transform: scale(var(--p0b-scale, 1)); transform-origin: top left; }
.p0b-phone-scroll { position: absolute; top: 0; right: 0; bottom: 56px; left: 0; overflow-x: hidden; overflow-y: auto; padding-bottom: 28px; scrollbar-width: none; }
.p0b-phone-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
.p0b-source-module { width: 100%; flex: 0 0 auto; }
.p0b-source-module :deep(.fc-wireframe) { width: 100%; min-height: 30px; }
.p0b-source-module :deep(.fc-wireframe--banner) { min-height: 118px; }
.p0b-source-module :deep(.fc-wireframe--games), .p0b-source-module :deep(.fc-wireframe--category) { min-height: 90px; }
.p0b-source-module--games :deep(.fc-wireframe--games) { min-height: 200px; }
.p0b-phone-floating { position: absolute; top: 48%; right: 5px; z-index: 5; display: flex; align-items: center; justify-content: center; width: 28px; min-height: 28px; pointer-events: none; }
.p0b-phone-floating :deep(.fc-wireframe) { width: 28px; min-height: 28px; }
.p0b-phone-fixed-bottom { position: absolute; right: 0; bottom: 0; left: 0; z-index: 4; overflow: hidden; background: var(--p0b-background); box-shadow: 0 -2px 8px rgb(15 23 42 / 8%); }
.p0b-phone-fixed-bottom :deep(.fc-wireframe) { width: 100%; }
.p0b-phone-topbar { display: flex; align-items: center; justify-content: space-between; height: 46px; padding: 0 14px; color: #fff; background: var(--p0b-primary); }
.p0b-logo { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 23px; border: 1px solid rgb(255 255 255 / 72%); border-radius: 3px; font-size: 9px; }
.p0b-top-icons { font-size: 14px; }
.p0b-hero { display: flex; align-items: flex-end; height: 160px; padding: 15px; color: rgb(255 255 255 / 92%); background: linear-gradient(135deg, color-mix(in srgb, var(--p0b-primary) 86%, #fff), color-mix(in srgb, var(--p0b-primary) 50%, #111827)); font-size: 14px; font-weight: 700; }
.p0b-notice { display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px; border-bottom: 1px solid color-mix(in srgb, var(--p0b-primary) 20%, #fff); background: #fff; }
.p0b-notice-icon { color: var(--p0b-primary); font-size: 8px; }
.p0b-text-line { display: inline-block; width: 90px; height: 5px; border-radius: 5px; background: color-mix(in srgb, var(--p0b-primary) 34%, #e5e7eb); }
.p0b-text-line.short { width: 42px; }
.p0b-venue-tabs, .p0b-subcategory-tabs { display: flex; gap: 5px; overflow: hidden; padding: 10px 10px 5px; white-space: nowrap; }
.p0b-venue-tabs button, .p0b-subcategory-tabs button { border: 0; border-radius: 3px; padding: 6px 8px; color: #64748b; background: #fff; font-size: 10px; }
.p0b-venue-tabs button.active, .p0b-subcategory-tabs button.active { color: #fff; background: var(--p0b-primary); }
.p0b-game-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; padding: 8px 10px 18px; }
.p0b-game-card { display: flex; min-height: 92px; flex-direction: column; align-items: center; justify-content: center; gap: 7px; border: 1px solid color-mix(in srgb, var(--p0b-primary) 14%, #dbe4e8); border-radius: 4px; background: #fff; }
.p0b-game-icon { width: 40px; height: 40px; border-radius: 9px; background: color-mix(in srgb, var(--p0b-primary) 22%, #e7eef0); }
.p0b-game-name { width: 45px; height: 4px; border-radius: 4px; background: #cbd5e1; }
.p0b-preview-empty { padding: 45px 10px; color: #94a3b8; text-align: center; font-size: 12px; }
.p0b-member-strip { display: flex; align-items: center; gap: 8px; margin: 0 10px 10px; padding: 9px; border-radius: 4px; background: color-mix(in srgb, var(--p0b-primary) 8%, #fff); }
.p0b-avatar { width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--p0b-primary) 45%, #e5e7eb); }
.p0b-bottom-nav { position: absolute; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-around; padding: 9px 4px 6px; color: var(--p0b-primary); background: #fff; box-shadow: 0 -2px 8px rgb(15 23 42 / 8%); }
.p0b-bottom-nav span { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 17px; line-height: 1; }
.p0b-bottom-nav small { color: #64748b; font-size: 9px; }
.p0b-preview-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.p0b-template-meta { display: grid; gap: 3px; margin: -3px 0 10px; padding: 7px 9px; border-left: 3px solid #0f9d91; background: #f7faf9; }
.p0b-theme-summary { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 3px; background: #fafafa; }
.p0b-swatch { width: 20px; height: 20px; border: 1px solid rgb(15 23 42 / 10%); border-radius: 3px; }
.p0b-theme-summary div { display: grid; gap: 2px; margin-left: 4px; font-size: 11px; }
.p0b-theme-summary span { color: #6b7280; }
.p0b-venue-card { display: grid; gap: 8px; margin-top: 8px; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; }
.p0b-venue-head, .p0b-subcategory-main, .p0b-subcategory-actions, .p0b-domain-row, .p0b-game-filters { display: flex; align-items: center; gap: 7px; }
.p0b-venue-head .n-input { flex: 1; }
.p0b-subcategory-row { display: grid; gap: 6px; padding: 8px; border: 1px solid #eef2f3; border-radius: 3px; background: #fbfdfd; }
.p0b-subcategory-main .n-input { min-width: 120px; flex: 1; }
.p0b-subcategory-main .n-select { width: 118px; }
.p0b-subcategory-actions { justify-content: flex-end; color: #6b7280; font-size: 11px; }
.p0b-add-subcategory { width: 100%; }
.p0b-domain-row .n-input { flex: 1; }
.p0b-game-filters { flex-wrap: wrap; margin-bottom: 10px; }
.p0b-game-filters .n-select { width: 150px; }
.p0b-game-filters .n-input { min-width: 150px; flex: 1; }
.p0b-game-list { max-height: 360px; overflow: auto; border-top: 1px solid #e5e7eb; }
.p0b-game-option { display: grid; grid-template-columns: 24px 1fr auto; align-items: center; gap: 6px; padding: 8px 4px; border-bottom: 1px solid #f1f5f9; cursor: pointer; font-size: 13px; }
.p0b-game-option small { color: #94a3b8; }
.p0b-modal-preview { display: flex; max-width: calc(100vw - 48px); max-height: calc(100vh - 190px); justify-content: flex-start; overflow: auto; }
.p0b-modal-state-grid { align-items: flex-start; gap: 18px; padding: 4px; }
@media (max-width: 980px) { .p0b-head { align-items: flex-start; flex-direction: column; } .p0b-layout { grid-template-columns: 1fr; overflow: auto; } .p0b-preview-column { order: 2; min-height: 520px; } .p0b-config-column { min-height: 520px; } }
</style>
