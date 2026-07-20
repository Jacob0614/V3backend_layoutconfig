<template>
  <div class="p0b-merchant-page">
    <section class="p0b-page-head">
      <div>
        <div class="p0b-title-row"><h1>版面配置</h1><n-tag size="small" type="info" :bordered="false">P0-B／H5</n-tag></div>
        <p>選擇商戶後配置 H5 模板、主題與遊戲場館。</p>
      </div>
      <n-tag size="small" type="info" :bordered="false">{{ merchants.length }} 個已授權商戶</n-tag>
    </section>

    <n-card size="small" class="p0b-list-card">
      <template #header><div class="p0b-card-header"><strong>商戶清單</strong><span class="p0b-muted">本階段只操作 H5</span></div></template>
      <n-table :bordered="false" :single-line="false" class="p0b-merchant-table">
        <thead>
          <tr>
            <th>商戶編號／品牌</th>
            <th>H5已發布版面</th>
            <th>草稿狀態</th>
            <th>建立人／時間</th>
            <th>審核人／時間</th>
            <th>最後修改人／時間</th>
            <th class="p0b-action-head">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="merchant in merchants" :key="merchant.id">
            <td><div class="p0b-meta"><strong>{{ merchant.code }}</strong><span>{{ merchant.brandName }}</span></div></td>
            <td><n-tag v-if="merchant.h5Version" size="small" type="success" :bordered="false">{{ merchant.h5Version }}</n-tag><n-text v-else depth="3">尚未發布</n-text></td>
            <td><n-tag v-if="merchant.hasDraft" size="small" type="warning" :bordered="false"><span class="p0b-status-dot" />{{ merchant.draftStatus }}</n-tag><n-text v-else depth="3">無草稿</n-text></td>
            <td><div class="p0b-meta"><strong>{{ merchant.creator }}</strong><span>{{ merchant.createdAt }}</span></div></td>
            <td><div class="p0b-meta"><strong>{{ merchant.approver }}</strong><span>{{ merchant.approvedAt }}</span></div></td>
            <td><div class="p0b-meta"><strong>{{ merchant.lastModifiedBy }}</strong><span>{{ merchant.lastModified }}</span></div></td>
            <td class="p0b-actions">
              <n-button v-if="merchant.hasDraft" text type="primary" @click="continueDraft(merchant)">繼續編輯<span class="p0b-button-dot" /></n-button>
              <n-button v-else-if="merchant.h5Version" text @click="editMerchant(merchant)">編輯</n-button>
              <n-button v-else text type="primary" @click="newMerchant(merchant)">新增 H5</n-button>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-card>

    <n-alert type="info" :bordered="false" class="p0b-note">
      P0-B 完成 H5 模板、主題、場館規格與前台預覽驗收後，才進行商戶切換；PC、其他設備端與後續治理功能不在本頁。
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { NAlert, NButton, NCard, NTag, NTable, NText, useDialog, useMessage } from 'naive-ui';
import { clearStoredDraft, hasStoredDraft, readStoredDraft } from './draftState';
import { api } from './data';

interface MerchantRow {
  id: string;
  code: string;
  name: string;
  brandName: string;
  publishedByPlatform: Record<'desktop' | 'mobile' | 'app', string>;
  hasDraft: boolean;
  draftStatus: string;
  h5Version: string;
  creator: string;
  createdAt: string;
  approver: string;
  approvedAt: string;
  lastModifiedBy: string;
  lastModified: string;
}

interface DraftSummary {
  statusByPlatform?: Partial<Record<'desktop' | 'mobile' | 'app', string>>;
  lastModifiedByPlatform?: Partial<Record<'desktop' | 'mobile' | 'app', string>>;
}

const router = useRouter();
const dialog = useDialog();
const message = useMessage();
const merchants = reactive<MerchantRow[]>([]);

function formatTimestamp(value: string) {
  const match = value.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return value;
  const [, year, month, day, hour, minute, second = '00'] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}:${second}`;
}

function getDraftState(merchantId: string) {
  const payload = readStoredDraft<DraftSummary>(merchantId);
  const hasStored = hasStoredDraft(merchantId, merchantId === 'ar-demo');
  const status = payload?.statusByPlatform?.mobile;
  const hasDraft = hasStored && status !== '已發布';
  const modified = payload?.lastModifiedByPlatform?.mobile;
  return { hasDraft, draftStatus: status || '草稿', lastModified: modified ? formatTimestamp(modified) : '' };
}

async function loadMerchants() {
  const response = await api.getMerchantList();
  merchants.splice(0, merchants.length, ...response.data.list.map((item) => {
    const draft = getDraftState(item.id);
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      brandName: item.brandName,
      publishedByPlatform: item.publishedByPlatform,
      h5Version: item.publishedByPlatform.mobile,
      hasDraft: draft.hasDraft,
      draftStatus: draft.draftStatus,
      creator: item.creator,
      createdAt: item.createdAt,
      approver: item.approver,
      approvedAt: item.approvedAt,
      lastModifiedBy: item.lastModifiedBy,
      lastModified: draft.lastModified || item.lastModified,
    };
  }));
}

onMounted(() => { void loadMerchants(); });

function openEditor(merchant: MerchantRow, mode: 'new' | 'continue' | 'edit') {
  router.push({ name: 'config_layoutConfig_edit', params: { tenantId: merchant.id }, query: { mode, merchantName: merchant.name, platform: 'mobile' } });
}

function newMerchant(merchant: MerchantRow) {
  if (!merchant.hasDraft) {
    openEditor(merchant, 'new');
    return;
  }
  dialog.warning({
    title: '已有 H5 草稿',
    content: '請選擇繼續編輯現有草稿，或永久捨棄草稿後建立新草稿。',
    positiveText: '繼續編輯',
    negativeText: '捨棄後新增',
    onPositiveClick: () => openEditor(merchant, 'continue'),
    onNegativeClick: () => {
      clearStoredDraft(merchant.id);
      merchant.hasDraft = false;
      merchant.draftStatus = '無草稿';
      message.success('H5草稿已永久捨棄。');
      openEditor(merchant, 'new');
    },
  });
}

function editMerchant(merchant: MerchantRow) {
  if (!merchant.hasDraft) {
    openEditor(merchant, 'edit');
    return;
  }
  dialog.warning({
    title: '商戶已有 H5 草稿',
    content: '請選擇繼續編輯草稿，或捨棄草稿後建立新草稿。',
    positiveText: '繼續編輯草稿',
    negativeText: '捨棄後建立新草稿',
    onPositiveClick: () => openEditor(merchant, 'continue'),
    onNegativeClick: () => {
      clearStoredDraft(merchant.id);
      merchant.hasDraft = false;
      merchant.draftStatus = '無草稿';
      message.success('H5草稿已永久捨棄。');
      openEditor(merchant, 'edit');
    },
  });
}

function continueDraft(merchant: MerchantRow) { openEditor(merchant, 'continue'); }
</script>

<style scoped>
.p0b-merchant-page { max-width: 1600px; margin: 0 auto; color: #1f2937; }
.p0b-page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.p0b-breadcrumb, .p0b-muted, .p0b-page-head p { color: #6b7280; font-size: 12px; }
.p0b-title-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.p0b-title-row h1 { margin: 0; font-size: 22px; }
.p0b-page-head p { margin: 5px 0 0; font-size: 13px; }
.p0b-list-card { border-radius: 4px; }
.p0b-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.p0b-merchant-table { width: 100%; }
.p0b-merchant-table th, .p0b-merchant-table td { white-space: nowrap; }
.p0b-meta { display: grid; gap: 3px; }
.p0b-meta span { color: #6b7280; font-size: 12px; }
.p0b-status-dot, .p0b-button-dot { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; background: #d97706; }
.p0b-button-dot { margin: 0 0 2px 5px; }
.p0b-actions { text-align: right; }
.p0b-action-head { text-align: right; }
.p0b-note { margin-top: 12px; }
@media (max-width: 1100px) { .p0b-page-head { align-items: flex-start; flex-direction: column; } .p0b-list-card { overflow-x: auto; } .p0b-merchant-table { min-width: 980px; } }
</style>
