# V3 整合契約：版面配置原型

## 目標

此目錄是可移入 V3 的功能原型。正式整合時，保留功能頁資料與配置模型，將平台級 Layout、Header、權限與 API 實作接回 V3 正式模組。

## 對應位置

| 原型 | V3 整合位置 | 規則 |
| --- | --- | --- |
| `src/router/modules/config.ts` | `src/router/modules/config.ts` | 只保留此頁路由與 `meta.roles`，接入 V3 aggregate |
| `src/views/config/frontendCustom/MerchantList.vue` | `src/views/config/frontendCustom/MerchantList.vue` | 商戶清單 UI 與操作流程 |
| `src/views/config/frontendCustom/index.vue` | `src/views/config/frontendCustom/index.vue` | 單一商戶、單一設備端編輯流程 |
| `src/views/config/frontendCustom/data.ts` | 同頁 `data.ts` | 所有 mock 方法維持 `{ code, result, data, msg }` envelope |
| `src/layout/components/Header` | V3 `src/layout/components/Header` | 原型只保留 Header 邊界；正式整合使用 V3 真實 Header 服務與元件 |
| `src/layout/components/MegaMenu.vue` | V3 `MegaMenu.vue` | 由 V3 路由樹產生完整主導航內容 |

## 路由規則

- 頁面掛在 `/config-center/layoutConfig`。
- 舊 `/config-center/frontendCustom` 只保留導向，不建立第二套功能頁。
- 清單、編輯與導向路由均帶 `meta.roles`。
- `meta.title`、`parentTitle` 使用 i18n key，不在路由內寫顯示文字。

## 資料規則

- 原型不呼叫真實 HTTP，不引入 axios、fetch 或 mock adapter。
- 商戶清單與版面配置資料從同頁 `data.ts` 進入；瀏覽器保存僅作為本地原型狀態。
- PC／H5／APP 的配置、草稿、版本、預覽狀態獨立保存。
- 編輯頁切換設備端只檢查目前端；目前端有未保存變更時，必須先保存草稿或捨棄後切換。
- 新增版面先選目標設備端，再建立該端的模板配置；批量新增仍由批量操作獨立選擇設備端。
- AR 模板資料僅可供 H5／APP 使用；PC 模板清單為空，不得把 H5／APP 模板套用至 PC。PC 仍保留版面設定入口，狀態顯示為未選模板。
- 編輯頁先完成版面設定（模板、主題、底部導航），按「下一步」後才進入配置首頁模組；配置首頁模組階段只顯示模組庫與模組設定，不顯示版面設定分頁。
- 模板、主題、底部導航與模組配置都以設備端為資料邊界；切換設備端前只處理目前端的未保存狀態。
- 低保真畫布只表達功能區、色塊、圖標與位置，不放額外說明文案；完整文案與互動只在預覽狀態展示。預覽必須使用對應設備尺寸等比縮小，不得只縮放外框。
- 單筆套用先選來源商戶、設備端，再套用該端已發布版本；目標設備端已有草稿時禁止覆蓋。
- 批量套用先選來源商戶，再選一個或多個設備端；每個來源設備端都必須存在已發布版本，否則批量動作不可送出。
- 批量新增／套用以商戶與設備端為最小建立單位；既有草稿只保留，不覆蓋，成功與失敗結果分開記錄並可單獨重試。
- 批量結果必須建立可持續讀取的草稿交接資料；重新整理或重新進入時仍可從各自設備端草稿繼續編輯。
- 發布失敗不得替換前台穩定版本；前台維持前一個已發布版本，失敗版本保留失敗原因、時間與重試狀態。
- PC／H5／APP 發布互相獨立；單一設備端發布失敗不得阻斷其他設備端已核准版本發布。
- 送審時保存審批規則快照；審批中的版本沿用送審時規則，新送審版本使用最新規則。
- 審批中的版本不可直接編輯，必須退回後才可修改並重新進入審批流程。
- 返回商戶清單或離開頁面時，若任一設備端有未保存變更，必須統一處理全部未保存設備端，不得只處理目前端。
- 共用版面以「版面 ID＋設備端」識別；直接修改共用版面會建立該版面該設備端的新草稿，不得直接修改已發布版本。
- 共用版面送審時必須保留引用商戶與設備端清單；審批通過並發布後，所有引用該版面與設備端的商戶同步使用新版本。
- 共用版面同步不得繞過審批；發布失敗時所有引用端維持原已發布版本。

## 平台層整合規則

- 正式 V3 的 `Layout`、`PageHeader`、`MegaMenu`、角色過濾、商戶切換、通知與操作紀錄由 V3 平台提供。
- 原型的 Header 只作為可視化邊界與互動占位，不得在正式整合時複製第二套平台狀態。
- 角色、權限與審批資料接入 V3 後端 API 時，保留本頁欄位名稱與狀態機，不改動頁面操作語意。

## 合併執行順序

1. 先將 `src/views/config/frontendCustom`、`src/router/modules/config.ts`、`src/i18n` 的本頁內容移入 V3 對應目錄。
2. 將 `src/router/modules/_aggregate.ts` 的 `config` 路由接入 V3 對應端聚合檔，不直接改 V3 router 根檔。
3. 將本頁 `data.ts` 的 mock 方法逐一替換為 V3 API；方法名稱、請求欄位與 `{ code, result, data, msg }` 回應外形保持不變。
4. 將原型 `AppLayout`、`Header`、`MegaMenu` 移除出正式頁面渲染鏈，改由 V3 既有 Layout、Header、配置中心分頁與角色過濾提供。
5. 將 V3 的實際商戶、權限、審批、版本與操作紀錄資料接入後，保留本頁的設備端獨立保存與跨端切換提示流程。
6. 在 V3 shell 下重新執行路由、角色、視覺、草稿、送審與瀏覽器回歸驗收；未通過前不得宣稱完成整合。

## 不可發生的整合結果

- 不新增第二套 Layout、Header、MegaMenu、商戶切換或角色切換狀態。
- 不把舊 `frontendCustom` 路徑保留成第二套頁面；它只能導向 `layoutConfig`。
- 不在頁面內自行呼叫 HTTP、axios 或 fetch；正式 API 只能由 V3 API 層提供。
- 不把 PC、H5、APP 合併成單一配置；三端資料與保存狀態仍須獨立。
- 不以批量成功或發布失敗覆蓋目標商戶既有草稿或前台穩定版本。
- 不把共用版面修改直接寫入已發布配置；未通過審批不得同步引用商戶。

## 承接驗收清單

- [x] 路由位於 `/config-center/layoutConfig`，含清單與單商戶編輯路由。
- [x] 路由均具備 `meta.roles`，標題使用 i18n key。
- [x] 清單與編輯頁各有同目錄 `data.ts` 邊界，mock 使用標準 envelope。
- [x] 原型 Header 與 MegaMenu 已拆成可替換邊界，正式整合不需修改功能頁。
- [x] PC／H5／APP 設備端狀態獨立，跨設備切換具保存提示。
- [x] 單筆套用已限定來源設備端；批量新增／套用已按商戶與設備端建立本地草稿交接資料。
- [x] 批量操作保留既有設備端草稿；發布失敗狀態保留前台前一版本標記。
- [x] 清單提供直接修改共用版面入口，修改前顯示設備端與所有引用商戶。
- [x] 共用版面修改獨立建立草稿，送審後發布才同步引用商戶；發布失敗維持原版本。
- [x] `typecheck`、`build` 與瀏覽器清單／編輯頁路由核對通過。
- [ ] 正式 V3 shell 內的角色、商戶、API、審批與操作紀錄回歸驗收：待合併至 V3 後執行。

## 驗證

```bash
CI=true pnpm run typecheck
CI=true pnpm run build
```

兩項都通過後，才可視為原型程式結構可進行 V3 整合；功能與視覺仍需在正式 V3 shell 內進行一次回歸驗收。
