<template>
  <div class="fc-page fc-editor-page">
    <n-alert v-if="isSharedEditFlow" type="warning" :bordered="false" class="fc-shared-layout-alert">
      共用版面：{{ sharedLayoutMeta?.label || sharedLayoutId }}／{{ currentPlatform.label }}。審批通過並發布後，將同步更新 {{ sharedReferenceCount }} 個引用商戶。
    </n-alert>

    <n-card size="small" class="fc-process-card">
      <div class="fc-process-row">
        <n-steps
          :current="processStep"
          :clickable="true"
          size="small"
          class="fc-process-steps"
          @update:current="selectProcessStep"
        >
          <n-step title="選擇模板" />
          <n-step title="修改模組" />
          <n-step title="修改素材" />
        </n-steps>
        <div class="fc-process-side">
          <div class="fc-platform-select-wrap">
            <n-select
              :value="activePlatform"
              :options="platformOptions"
              size="small"
              class="fc-platform-select"
              @update:value="selectPlatform"
            />
          </div>
          <div class="fc-editor-actions">
            <n-tag :type="currentStatus === '待審批' ? 'info' : currentStatus === '已發布' ? 'success' : currentStatus === '發布失敗' ? 'error' : 'warning'" :bordered="false">{{ currentStatus }}</n-tag>
            <n-button quaternary size="small" title="版本" @click="versionsVisible = true">版本</n-button>
            <n-button secondary size="small" title="預覽" @click="openPreview()">預覽</n-button>
            <n-button type="primary" size="small" title="保存草稿" :disabled="!dirtyByPlatform[activePlatform]" @click="saveDraft">保存</n-button>
            <n-button type="success" size="small" title="送審" :disabled="!canSubmit" @click="submitApproval">送審</n-button>
            <n-button v-if="currentStatus === '待審批'" type="success" size="small" title="審批通過" @click="approveVersion">通過</n-button>
            <n-button v-if="currentStatus === '待審批'" quaternary size="small" title="退回" @click="openRejectModal">退回</n-button>
            <n-button v-if="currentStatus === '已審批'" type="success" size="small" title="立即發布" @click="publishImmediately">發布</n-button>
            <n-button v-if="currentStatus === '已審批'" secondary size="small" title="排程發布" @click="openScheduleModal">排程</n-button>
            <n-button v-if="currentStatus === '排程中'" quaternary size="small" title="取消排程" @click="cancelScheduledPublish">取消</n-button>
            <n-button v-if="currentStatus === '發布失敗'" type="warning" size="small" title="重試發布" @click="retryPublish">重試</n-button>
            <n-button v-if="currentStatus === '發布失敗'" quaternary size="small" title="回報系統" @click="reportPublishFailure">回報</n-button>
            <n-button quaternary size="small" title="返回商戶清單" @click="goBack">返回</n-button>
          </div>
        </div>
      </div>
    </n-card>

    <div class="fc-workbench">
      <section class="fc-canvas-column">
        <n-card size="small" class="fc-card">
          <n-empty v-if="!currentConfig.modules.length" description="請先選擇首頁模板" class="fc-empty-canvas" />
          <div
            v-else
            ref="canvasRef"
            class="fc-canvas"
            :class="`fc-canvas--${activePlatform}`"
            :style="themeStyle(currentConfig)"
            role="region"
            tabindex="0"
            :aria-label="`${currentPlatform.label}首頁畫布`"
          >
            <div
              class="fc-canvas-scroll"
              :style="activePlatform !== 'desktop' ? { '--fc-dual-gap': `${24 * canvasScale}px` } : undefined"
            >
              <div
                v-for="canvasAuthState in canvasAuthStates"
                :key="canvasAuthState"
                class="fc-canvas-state"
                :style="activePlatform !== 'desktop' ? { '--fc-state-scale': canvasScale } : undefined"
              >
                <span v-if="activePlatform !== 'desktop'" class="fc-canvas-state-label">{{ canvasAuthState === 'loggedIn' ? '登入後' : '登入前' }}</span>
                <div class="fc-canvas-content" :style="{ ...canvasContentStyle, zoom: canvasScale }">
                  <div v-if="activePlatform === 'desktop'" class="fc-canvas-layout-guide" :style="pageLayoutGuideStyle" aria-hidden="true">
                    <span v-for="column in pageLayoutColumnWidths" :key="column.label" />
                  </div>
                  <template v-for="module in currentConfig.modules" :key="module.id">
                    <div
                      v-if="(module.type !== 'bottomNav' || activePlatform === 'desktop') && (module.type !== 'floating' || isFloatingVisible(module))"
                      class="fc-module"
                      :class="{ selected: module.id === selectedModuleId, 'fc-module--floating': module.type === 'floating' }"
                      :style="module.type === 'floating' ? floatingModuleStyle(module) : layoutModuleStyle(module)"
                      @click="selectModule(module.id)"
                      @pointerdown="module.type === 'floating' ? beginFloatingDrag($event, module) : undefined"
                    >
                      <ModuleWireframe fidelity="low" :module="moduleWithPageGameVenues(module, currentConfig)" :platform="activePlatform" :template-id="currentConfig.templateId" :auth-state="activePlatform === 'desktop' ? currentConfig.pageLayout.authState : canvasAuthState" />
                      <n-space size="small" class="fc-module-actions" @click.stop>
                        <n-button quaternary circle size="small" :title="module.type === 'floating' ? '移除浮標' : '移除模組'" @click.stop="removeModule(module.id)">×</n-button>
                      </n-space>
                    </div>
                  </template>
                </div>
                <div
                  v-if="activePlatform !== 'desktop' && bottomNavModule"
                  class="fc-canvas-fixed-bottom fc-module"
                  :class="{ selected: bottomNavModule.id === selectedModuleId }"
                  :style="{ zoom: canvasScale }"
                  @click="selectModule(bottomNavModule.id)"
                >
                  <ModuleWireframe fidelity="low" :module="bottomNavModule" :platform="activePlatform" :template-id="currentConfig.templateId" :auth-state="canvasAuthState" />
                </div>
              </div>
            </div>
            <div v-if="activePlatform === 'desktop'" class="fc-canvas-auth-toggle">
              <span>畫布狀態</span>
              <n-switch :value="currentConfig.pageLayout.authState === 'loggedIn'" @update:value="toggleAuthState" />
              <b>{{ currentConfig.pageLayout.authState === 'loggedIn' ? '登入後' : '登入前' }}</b>
            </div>
          </div>
        </n-card>

      </section>

      <aside class="fc-inspector">
        <n-card size="small" class="fc-card fc-inspector-card">
          <div class="fc-inspector-tabs-shell" :class="{ 'fc-inspector-tabs-shell--with-next': inspectorTab === 'pageLayout' }">
          <n-tabs v-model:value="inspectorTab" type="line" animated>
            <n-tab-pane v-if="processStep === 2" name="library" tab="模組庫">
              <template v-if="libraryCategory">
                <div class="fc-library-detail-head">
                  <n-button quaternary size="small" @click="libraryCategory = null">返回模組分類</n-button>
                  <strong>{{ libraryCategoryLabel }}</strong>
                </div>
                <div class="fc-library-variant-grid">
                  <button
                    v-for="item in libraryCategoryItems"
                    :key="`${item.type}-${item.variant}`"
                    type="button"
                    class="fc-library-variant"
                    @click="applyLibrary(item)"
                  >
                    <div v-if="item.referenceAsset" class="fc-library-variant-preview fc-topnav-reference-preview">
                      <img :src="item.referenceAsset" :alt="`${item.label}來源框架`" />
                    </div>
                    <div v-else class="fc-library-variant-preview">
                      <ModuleWireframe :module="previewModule(item)" :platform="activePlatform" />
                    </div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.note }}</span>
                    <small>選擇此形式</small>
                  </button>
                </div>
              </template>
              <n-list v-else hoverable>
                <n-list-item v-for="group in libraryGroups" :key="group.category" class="fc-library-group-item" @click="addModuleFromCategory(group.category)">
                  <div class="fc-library-group">
                    <div class="fc-library-symbol">{{ group.symbol }}</div>
                    <div class="fc-library-copy">
                      <strong>{{ group.label }}</strong>
                      <span>{{ group.count }} 種形式{{ group.multiple ? '／可加入多個' : '' }}</span>
                    </div>
                    <span class="fc-library-chevron">›</span>
                  </div>
                </n-list-item>
              </n-list>
            </n-tab-pane>

            <n-tab-pane v-if="processStep === 1" name="pageLayout" tab="版面設定">
              <n-tabs type="line" size="small" class="fc-page-layout-inner-tabs">
                <n-tab-pane name="layoutBase" tab="版面">
              <div class="fc-page-layout-settings">
                <div class="fc-settings-title">
                  <div class="fc-settings-title-row">
                    <n-text depth="3">{{ currentPlatform.label }}版面</n-text>
                    <span class="fc-layout-resolution">{{ currentPlatform.resolution }}</span>
                  </div>
                  <div class="fc-template-title-row">
                    <strong>{{ currentConfig.templateId || '未選模板' }}</strong>
                    <n-tag v-if="currentConfig.isCustomTemplate" size="tiny" type="info" :bordered="false">自定義</n-tag>
                    <n-select
                      v-if="activePlatform !== 'desktop'"
                      :value="currentConfig.templateId || null"
                      :options="templateOptions"
                      placeholder="選模板"
                      filterable
                      :virtual-scroll="false"
                      :consistent-menu-width="false"
                      class="fc-template-select"
                      @update:value="applyTemplate"
                    />
                    <n-tag v-else size="small" :bordered="false">PC 無固定模板</n-tag>
                  </div>
                </div>
                <n-form label-placement="top" size="small">
                  <div class="fc-theme-setting">
                    <div class="fc-theme-setting-head">
                      <span>主題</span>
                      <n-select
                        :value="currentConfig.pageLayout.themeId || null"
                        :options="themeOptions"
                        placeholder="選主題"
                        :consistent-menu-width="false"
                        class="fc-theme-select"
                        @update:value="setTheme"
                      />
                    </div>
                    <div v-if="selectedTheme" class="fc-theme-summary">
                      <div class="fc-theme-swatches" aria-label="主題色彩預覽">
                        <span :style="{ background: selectedTheme.background }" title="背景色" />
                        <span :style="{ background: selectedTheme.buttonColor }" title="主色／按鈕色" />
                        <span :style="{ background: selectedTheme.primaryButton }" title="主按鈕" />
                      </div>
                      <div class="fc-theme-summary-grid">
                        <span><b>主色</b><i :style="{ background: selectedTheme.buttonColor }" /></span>
                        <span><b>次色</b><i :style="{ background: selectedTheme.secondaryButton }" /></span>
                        <span><b>圓角</b>{{ selectedTheme.buttonRadius }}</span>
                        <span><b>站點</b>{{ selectedTheme.sites.length }}站</span>
                      </div>
                      <small>來源主題：{{ sourceThemeLabels || '未指定' }}</small>
                    </div>
                  </div>
                </n-form>
                <template v-if="activePlatform === 'desktop'">
                <div class="fc-page-setting-inline">
                  <span>側導航</span>
                  <div class="fc-setting-switch-row">
                    <n-switch :value="currentConfig.pageLayout.sideNavEnabled" @update:value="setSideNavEnabled" />
                    <span>{{ currentConfig.pageLayout.sideNavEnabled ? '開啟' : '關閉' }}</span>
                  </div>
                </div>
                <n-form label-placement="top" size="small">
                  <n-form-item label="欄數">
                    <div class="fc-page-option-grid fc-page-option-grid--3">
                      <button
                        v-for="option in pageColumnOptions"
                        :key="option.value"
                        type="button"
                        :class="{ active: currentConfig.pageLayout.columns === option.value }"
                        @click="setPageColumns(option.value)"
                      >{{ option.label }}</button>
                    </div>
                  </n-form-item>
                  <n-form-item label="版心">
                    <div class="fc-page-option-grid fc-page-option-grid--4">
                      <button
                        v-for="option in pageWidthOptions"
                        :key="option.value"
                        type="button"
                        :class="{ active: currentConfig.pageLayout.contentWidth === option.value }"
                        @click="setPageContentWidth(option.value)"
                      >{{ option.label }}</button>
                    </div>
                  </n-form-item>
                  <template v-if="currentConfig.pageLayout.columns > 1">
                    <n-form-item label="比例">
                      <div class="fc-page-option-grid fc-page-option-grid--3">
                        <button
                          v-for="option in pageRatioOptions"
                          :key="option.value"
                          type="button"
                          :class="{ active: currentConfig.pageLayout.columnRatio === option.value }"
                          @click="setPageColumnRatio(option.value)"
                        >{{ option.label }}</button>
                      </div>
                    </n-form-item>
                  </template>
                </n-form>
                </template>
                <div v-else class="fc-mobile-layout-settings">
                  <div class="fc-page-setting-inline">
                    <span>底部導航</span>
                    <n-tag size="small" type="info" :bordered="false">固定展示</n-tag>
                  </div>
                </div>
              </div>
                </n-tab-pane>
                <n-tab-pane name="gameVenues" tab="遊戲場館">
                  <div class="fc-game-config fc-game-config--page">
                    <div v-for="(venue, venueIndex) in currentGameVenues" :key="venue.id" class="fc-game-venue">
                      <div class="fc-game-venue-head">
                        <input :value="venue.name" aria-label="場館名稱" @input="setGameVenueName(venue.id, $event)" />
                        <span class="fc-game-order-actions">
                          <button type="button" title="場館上移" :disabled="venueIndex === 0" @click="moveGameVenue(venue.id, -1)">↑</button>
                          <button type="button" title="場館下移" :disabled="venueIndex === currentGameVenues.length - 1" @click="moveGameVenue(venue.id, 1)">↓</button>
                          <button type="button" title="刪除場館" @click="removeGameVenue(venue.id)">×</button>
                        </span>
                      </div>
                      <div v-for="(subcategory, subcategoryIndex) in venue.subcategories" :key="subcategory.id" class="fc-game-subcategory">
                        <div class="fc-game-subcategory-head">
                          <input :value="subcategory.name" aria-label="子分類名稱" @input="setGameSubcategoryName(venue.id, subcategory.id, $event)" />
                          <span class="fc-game-order-actions">
                            <button type="button" title="子分類上移" :disabled="subcategoryIndex === 0" @click="moveGameSubcategory(venue.id, subcategory.id, -1)">↑</button>
                            <button type="button" title="子分類下移" :disabled="subcategoryIndex === venue.subcategories.length - 1" @click="moveGameSubcategory(venue.id, subcategory.id, 1)">↓</button>
                            <button type="button" title="刪除子分類" @click="removeGameSubcategory(venue.id, subcategory.id)">×</button>
                          </span>
                        </div>
                        <div class="fc-game-source-line">{{ subcategory.mainCategoryIds.map((id) => gameMainCategoryCatalog.find((item) => item.id === id)?.name || id).join('／') || '未選主大類' }}／{{ subcategory.providerIds.map((id) => gameProviderCatalog.find((item) => item.id === id)?.name || id).join('／') || '未選供應商' }}</div>
                        <div class="fc-game-subcategory-controls">
                          <div class="fc-page-option-grid fc-page-option-grid--3">
                            <button v-for="item in gameDisplayModeOptions" :key="item.value" type="button" :class="{ active: subcategory.displayMode === item.value }" @click="setGameSubcategoryDisplayMode(venue.id, subcategory.id, item.value)">{{ item.label }}</button>
                          </div>
                          <div class="fc-setting-switch-row">
                            <n-switch :value="subcategory.iconVisible" @update:value="setGameSubcategoryIconVisible(venue.id, subcategory.id, $event)" />
                            <span>圖標</span>
                          </div>
                          <div v-if="subcategory.displayMode !== 'text' && subcategory.iconVisible" class="fc-game-icon-row">
                            <n-button size="tiny" secondary @click="openIconLibrary(`game:${venue.id}:${subcategory.id}`)">選圖標</n-button>
                            <label class="fc-upload-trigger fc-upload-trigger--small">
                              <span>上傳圖標</span>
                              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="handleGameSubcategoryIconUpload($event, venue.id, subcategory.id)" />
                            </label>
                            <small>{{ subcategory.iconName || `圖標庫／${gameIconLabel(subcategory.iconKey || 'games-outline')}` }}</small>
                          </div>
                          <n-button size="small" secondary @click="openGamePicker(venue.id, subcategory.id)">選擇遊戲（{{ subcategory.gameIds.length }}）</n-button>
                        </div>
                      </div>
                      <n-button size="small" dashed @click="addGameSubcategory(venue.id)">新增子分類</n-button>
                    </div>
                    <n-button size="small" dashed @click="addGameVenue">新增場館</n-button>
                  </div>
                </n-tab-pane>
              </n-tabs>
            </n-tab-pane>

            <n-tab-pane v-if="processStep === 2 || processStep === 3" name="settings" :tab="processStep === 2 ? '模組樣式' : '素材設定'">
              <template v-if="currentModule">
                <div class="fc-settings-title">
                  <n-text depth="3">目前模組</n-text>
                  <strong>{{ currentModule.label }}</strong>
                </div>
                <div v-if="processStep === 2" class="fc-module-setting-actions">
                  <span>排序</span>
                  <n-button quaternary circle size="small" title="上移模組" :disabled="currentConfig.modules.findIndex((module) => module.id === currentModule?.id) === 0" @click="currentModule && moveModule(currentModule.id, -1)">↑</n-button>
                  <n-button quaternary circle size="small" title="下移模組" :disabled="currentConfig.modules.findIndex((module) => module.id === currentModule?.id) === currentConfig.modules.length - 1" @click="currentModule && moveModule(currentModule.id, 1)">↓</n-button>
                </div>
                <n-form label-placement="top" size="small">
                  <template v-if="processStep === 2">
                  <n-form-item v-if="currentModule.type !== 'category' && variantOptions.length > 1" :label="currentModule.type === 'games' ? '遊戲分類版式' : '展示形式'">
                    <div class="fc-variant-picker">
                      <button
                        v-for="item in variantOptions"
                        :key="item.value"
                        type="button"
                        class="fc-variant-option"
                        :class="{ active: currentModule.variant === item.value }"
                        @click="changeVariant(item.value)"
                      >
                        <div v-if="currentModule.type === 'topNav' && item.referenceAsset" class="fc-variant-preview fc-topnav-reference-preview">
                          <img :src="item.referenceAsset" :alt="`${item.label}來源框架`" />
                        </div>
                        <div v-else class="fc-variant-preview">
                          <ModuleWireframe :module="previewVariant(item)" :platform="activePlatform" />
                        </div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.note }}</span>
                      </button>
                    </div>
                  </n-form-item>
                  <n-form-item v-else-if="currentModule.type === 'category'" label="遊戲大類入口版式">
                    <div class="fc-variant-picker">
                      <button
                        v-for="item in categoryVariantOptions"
                        :key="item.variant"
                        type="button"
                        class="fc-variant-option"
                        :class="{ active: currentModule.variant === item.variant }"
                        @click="changeVariant(item.variant)"
                      >
                        <div class="fc-variant-preview">
                          <ModuleWireframe :module="previewModule(item)" :platform="activePlatform" />
                        </div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.note }}</span>
                      </button>
                    </div>
                  </n-form-item>
                  <n-form-item v-else label="模組類型">
                    <n-tag size="small" :bordered="false">{{ currentModule.label }}</n-tag>
                  </n-form-item>
                  <n-form-item v-if="processStep === 2 && currentModule.type === 'category'" label="入口展示">
                    <div class="fc-game-display-settings">
                      <div class="fc-page-option-grid fc-page-option-grid--3">
                        <button v-for="item in gameDisplayModeOptions" :key="item.value" type="button" :class="{ active: (currentModule.entryDisplayMode || 'iconText') === item.value }" @click="setEntryDisplayMode(item.value)">{{ item.label }}</button>
                      </div>
                      <div class="fc-setting-switch-row">
                        <n-switch :value="currentModule.iconVisible !== false" @update:value="setEntryIconVisible" />
                        <span>顯示圖標</span>
                      </div>
                    </div>
                  </n-form-item>
                  </template>
                  <n-form-item v-if="processStep === 2 && currentModule.type === 'topNav' && currentModule.variant === 'wideLogo'" label="登入註冊列">
                    <div class="fc-setting-switch-row">
                      <n-switch :value="Boolean(currentModule.showAuthBar)" @update:value="setTopNavAuthBar" />
                      <span>{{ currentModule.showAuthBar ? '開啟' : '關閉' }}</span>
                    </div>
                  </n-form-item>
                  <template v-if="processStep === 3">
                  <n-form-item v-if="currentModule.type === 'banner'" label="Banner 比例">
                    <div class="fc-ratio-grid">
                      <button v-for="ratio in bannerRatios" :key="ratio" type="button" :class="{ active: currentModule.ratio === ratio }" @click="setRatio(ratio)">
                        {{ ratio }}
                      </button>
                    </div>
                  </n-form-item>
                  <template v-if="currentModule.type === 'banner' && activePlatform === 'desktop'">
                    <n-form-item label="展示張數">
                      <n-input-number
                        :value="currentModule.bannerCount || 1"
                        :min="0.1"
                        :max="10"
                        :step="0.1"
                        :precision="1"
                        @update:value="setBannerCount"
                      />
                    </n-form-item>
                    <n-form-item label="對齊位置">
                      <n-select :value="currentModule.bannerAlign || 'center'" :options="bannerAlignOptions" :consistent-menu-width="false" @update:value="setBannerAlign" />
                    </n-form-item>
                  </template>
                  <n-form-item v-if="currentModule.type === 'notice' && currentModule.variant === 'bar'" label="跑馬燈圖標">
                    <div class="fc-notice-icon-settings">
                      <span class="fc-notice-icon-preview">
                        <component :is="noticeIconPreview(currentModule.noticeIconKey || 'notice')" />
                      </span>
                      <div>
                        <strong>{{ currentModule.noticeIconName || `圖標庫／${noticeIconLabel(currentModule.noticeIconKey || 'notice')}` }}</strong>
                        <small>公告內容與固定路由不變，只更換圖標</small>
                      </div>
                      <n-button size="small" secondary @click="openIconLibrary('notice')">選擇圖標</n-button>
                    </div>
                  </n-form-item>
                  <n-form-item v-if="currentModule.type === 'games'" label="RTP 展示">
                    <div class="fc-setting-switch-row">
                      <n-switch :value="Boolean(currentModule.rtpEnabled)" @update:value="setRtpEnabled" />
                      <span>{{ currentModule.rtpEnabled ? '開啟 RTP' : '關閉 RTP' }}</span>
                    </div>
                  </n-form-item>
                  <template v-if="currentModule.variant === 'customDisplay'">
                    <n-form-item label="自訂展示列數">
                      <n-input-number :value="currentModule.customDisplayRows || 2" :min="1" :max="6" @update:value="setCustomDisplayRows" />
                    </n-form-item>
                    <n-form-item label="自訂展示欄數">
                      <n-input-number :value="currentModule.customDisplayColumns || 3" :min="1" :max="6" @update:value="setCustomDisplayColumns" />
                    </n-form-item>
                    <n-form-item label="自訂展示圖片">
                      <div class="fc-custom-display-grid" :style="{ '--fc-custom-columns': currentModule.customDisplayColumns || 3 }">
                        <div v-for="(slot, index) in currentModule.customDisplaySlots || []" :key="slot.id" class="fc-custom-display-slot">
                          <span>位置 {{ index + 1 }}</span>
                          <small>{{ slot.imageName || '尚未上傳' }}</small>
                          <label class="fc-upload-trigger fc-upload-trigger--small">
                            <span>上傳圖片</span>
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="handleCustomDisplayImage($event, index)" />
                          </label>
                        </div>
                      </div>
                    </n-form-item>
                  </template>
                  <n-form-item v-if="currentModule.type === 'floating'" label="圖標素材">
                    <div class="fc-floating-icon-settings">
                      <div class="fc-floating-entry-picker">
                        <button
                          v-for="item in floatingIconFunctionCatalog"
                          :key="item.key"
                          type="button"
                          :class="{ active: (currentModule.floatingIconFunction || 'rewardCenter') === item.key }"
                          @click="setFloatingIconFunction(item.key)"
                        >{{ item.label }}</button>
                      </div>
                      <div class="fc-floating-icon-current">
                        <span>{{ currentModule?.floatingIconName || `圖標庫／${floatingIconFunctionCatalog.find((item) => item.key === (currentModule?.floatingIconFunction || 'rewardCenter'))?.label || '預設圖標'}` }}</span>
                        <n-button size="small" secondary @click="openIconLibrary('floating')">進入圖標庫</n-button>
                      </div>
                    </div>
                  </n-form-item>
                  <n-form-item v-if="currentModule.type === 'floating'" label="展示頁面">
                    <div class="fc-floating-page-tree">
                      <details v-for="group in floatingPageGroups" :key="group.key" open>
                        <summary>
                          <strong>{{ group.label }}</strong>
                          <span>{{ selectedFloatingPageCount(group) }}/{{ group.pages.length }}</span>
                        </summary>
                        <label v-for="page in group.pages" :key="page.key" class="fc-floating-page-option">
                          <input
                            type="checkbox"
                            :checked="isFloatingPageSelected(page.key)"
                            @change="setFloatingPage(page.key, $event)"
                          />
                          <span>{{ page.label }}</span>
                        </label>
                      </details>
                    </div>
                  </n-form-item>
                  <n-form-item v-if="currentModule.type === 'bottomNav'" label="入口圖標">
                    <div class="fc-bottom-nav-settings">
                      <div v-for="item in currentModule.bottomNavItems || []" :key="item.key" class="fc-bottom-nav-entry">
                        <div class="fc-bottom-nav-entry-head">
                          <strong>{{ item.label }}</strong>
                          <n-tag size="tiny" :bordered="false">固定路由</n-tag>
                          <n-space size="small">
                            <n-button quaternary circle size="small" :disabled="(currentModule.bottomNavItems || [])[0]?.key === item.key" title="向上移動" @click="moveBottomNavEntry(item.key, -1)">↑</n-button>
                            <n-button quaternary circle size="small" :disabled="(currentModule.bottomNavItems || [])[((currentModule.bottomNavItems || []).length - 1)]?.key === item.key" title="向下移動" @click="moveBottomNavEntry(item.key, 1)">↓</n-button>
                          </n-space>
                        </div>
                        <small>{{ item.route }}</small>
                        <div class="fc-bottom-nav-icon-pair">
                          <div>
                            <span>啟用</span>
                            <n-button size="tiny" secondary @click="openIconLibrary(`bottom:${item.key}:active`)">選擇圖標</n-button>
                            <small>{{ item.activeIconName || `圖標庫／${bottomNavIconLabel(item.key, 'active')}` }}</small>
                          </div>
                          <div>
                            <span>未啟用</span>
                            <n-button size="tiny" secondary @click="openIconLibrary(`bottom:${item.key}:inactive`)">選擇圖標</n-button>
                            <small>{{ item.inactiveIconName || `圖標庫／${bottomNavIconLabel(item.key, 'inactive')}` }}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </n-form-item>
                  <template v-if="currentModule.type === 'topNav'">
                    <div v-if="currentModule.variant === 'dualAuth'" class="fc-topnav-section">
                      <div class="fc-topnav-section-head">
                        <strong>主按鈕位置</strong>
                        <n-tag size="tiny" :bordered="false">01／02</n-tag>
                      </div>
                      <div class="fc-page-option-grid fc-page-option-grid--2">
                        <button type="button" :class="{ active: currentModule.primaryButton !== 'register' }" @click="setTopNavPrimaryButton('login')">登入實色</button>
                        <button type="button" :class="{ active: currentModule.primaryButton === 'register' }" @click="setTopNavPrimaryButton('register')">註冊實色</button>
                      </div>
                    </div>
                    <div class="fc-topnav-settings">
                      <div v-if="currentModule.variant !== 'goGame'" class="fc-topnav-section">
                        <div class="fc-topnav-section-head">
                          <strong>LOGO 素材</strong>
                          <n-tag size="tiny" :bordered="false">可上傳</n-tag>
                        </div>
                        <div class="fc-logo-upload">
                          <span class="fc-logo-upload-preview" aria-label="LOGO 預覽" />
                          <label class="fc-upload-trigger">
                            <span>上傳 LOGO</span>
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="handleLogoChange" />
                          </label>
                          <n-text depth="3" class="fc-file-name">{{ currentModule.logoName || '尚未上傳 LOGO' }}</n-text>
                        </div>
                      </div>

                      <div v-if="currentModule.variant !== 'goGame'" class="fc-topnav-section">
                        <div class="fc-topnav-section-head">
                          <strong>已配置按鈕模組</strong>
                          <n-text depth="3">{{ configuredTopNavButtons.length }} 個</n-text>
                        </div>
                        <div v-if="configuredTopNavButtons.length" class="fc-topnav-button-list">
                          <div v-for="item in configuredTopNavButtons" :key="item.key" class="fc-topnav-button-row">
                            <span class="fc-topnav-icon">
                              <img v-if="currentModule.buttonIconSources?.[item.key]" :src="currentModule.buttonIconSources[item.key]" :alt="`${item.label}自訂圖標`" />
                              <component v-else :is="topNavButtonIcon(item.key)" />
                            </span>
                            <span class="fc-topnav-button-copy">
                              <strong>{{ item.label }}</strong>
                              <small>{{ item.note }}</small>
                              <small class="fc-topnav-button-file">{{ currentModule.buttonIconNames?.[item.key] || `圖標庫／${topNavIconLabel(item.key)}` }}</small>
                            </span>
                            <n-button secondary size="tiny" :title="`開啟${item.label}圖標庫`" @click="openIconLibrary(item.key)">選擇圖標</n-button>
                            <n-tag size="tiny" :bordered="false">固定路由</n-tag>
                            <n-button v-if="!item.required" quaternary circle size="small" title="移除入口" @click="removeTopNavButton(item.key)">×</n-button>
                          </div>
                        </div>
                        <n-empty v-else description="尚未配置按鈕模組" :show-icon="false" />
                      </div>

                      <div class="fc-topnav-section">
                        <div class="fc-topnav-section-head">
                          <strong>未配置按鈕模組</strong>
                          <n-text depth="3">其他可配置圖標</n-text>
                        </div>
                        <div v-if="unconfiguredTopNavButtons.length" class="fc-topnav-button-list">
                          <div v-for="item in unconfiguredTopNavButtons" :key="item.key" class="fc-topnav-button-row fc-topnav-button-row--available">
                            <span class="fc-topnav-icon"><component :is="item.icon" /></span>
                            <span class="fc-topnav-button-copy">
                              <strong>{{ item.label }}</strong>
                              <small>{{ item.note }}</small>
                            </span>
                            <n-button size="tiny" secondary @click="addTopNavButton(item.key)">配置</n-button>
                          </div>
                        </div>
                        <n-empty v-else description="所有可用圖標已配置" :show-icon="false" />
                      </div>
                    </div>
                  </template>
                  </template>
                </n-form>
                <div v-if="processStep === 2 && currentModule.interaction" class="fc-module-contract">
                  <div class="fc-module-contract-row">
                    <strong>互動</strong>
                    <span>{{ currentModule.interaction === 'switch' ? '原頁切換' : '跳二級頁' }}</span>
                  </div>
                  <div class="fc-module-contract-row">
                    <strong>本步驟</strong>
                    <span>只選擇模組類型與展示形式</span>
                  </div>
                </div>
              </template>
              <n-empty v-else description="請先選擇首頁模組" />
            </n-tab-pane>
          </n-tabs>
          <n-button
            v-if="processStep < 3"
            type="primary"
            size="small"
            class="fc-inspector-next"
            :disabled="!canProceedToModules"
            @click="goToNextStep"
          >下一步</n-button>
          </div>
        </n-card>
      </aside>
    </div>

    <n-modal v-model:show="previewVisible" preset="card" class="fc-preview-modal" :title="`${previewMeta.label}首頁預覽`">
      <div class="fc-preview-stage">
        <div ref="previewDeviceRef" class="fc-preview-frame" :class="`fc-preview-frame--${previewPlatform}`" :style="themeStyle(previewConfig)">
          <div class="fc-preview-content" :style="{ zoom: previewScale }">
            <template v-for="module in previewConfig.modules" :key="module.id">
              <div
                v-if="(module.type !== 'bottomNav' || previewPlatform === 'desktop') && (module.type !== 'floating' || isFloatingVisible(module))"
                class="fc-preview-module"
                :class="{ 'fc-preview-module--floating': module.type === 'floating' }"
                :style="module.type === 'floating' ? floatingModuleStyle(module, previewPlatform) : undefined"
              >
                <ModuleWireframe fidelity="high" :module="moduleWithPageGameVenues(module, previewConfig)" :platform="previewPlatform" :template-id="previewConfig.templateId" :auth-state="previewConfig.pageLayout.authState" />
              </div>
            </template>
          </div>
          <div v-if="previewPlatform !== 'desktop' && previewBottomNavModule" class="fc-preview-fixed-bottom" :style="{ zoom: previewScale }">
            <ModuleWireframe fidelity="high" :module="previewBottomNavModule" :platform="previewPlatform" :template-id="previewConfig.templateId" :auth-state="previewConfig.pageLayout.authState" />
          </div>
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-tag type="success" :bordered="false">畫面渲染與必要資料已載入
          </n-tag>
          <n-button type="primary" @click="previewVisible = false">完成預覽
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="rejectModalVisible" preset="card" title="退回版本">
      <n-form label-placement="top" size="small">
        <n-form-item label="退回原因" required>
          <n-input v-model:value="rejectReason" type="textarea" placeholder="請填寫退回原因" :autosize="{ minRows: 3, maxRows: 6 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="rejectModalVisible = false">取消</n-button>
          <n-button type="warning" :disabled="!rejectReason.trim()" @click="rejectVersion">確認退回</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="scheduleModalVisible" preset="card" title="排程發布">
      <n-form label-placement="top" size="small">
        <n-form-item label="預定發布時間" required>
          <n-input v-model:value="scheduleAt" placeholder="YYYY-MM-DD HH:mm（商戶時區）" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="scheduleModalVisible = false">取消</n-button>
          <n-button type="primary" :disabled="!scheduleAt.trim()" @click="schedulePublish">確認排程</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="iconLibraryVisible" preset="card" class="fc-icon-library-modal" title="圖標庫">
      <div v-if="iconLibraryTargetMeta" class="fc-icon-library">
        <div class="fc-icon-library-head">
          <strong>{{ iconLibraryTargetMeta.label }}圖標</strong>
          <span>入口功能與固定路由不變，僅更換展示圖標。</span>
        </div>
        <div class="fc-icon-library-grid">
          <button
            v-for="item in iconLibraryOptions"
            :key="item.key"
            type="button"
            class="fc-icon-library-option"
            :class="{ active: iconLibrarySelectedKey === item.key }"
            @click="selectIconFromLibrary(item.key)"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
            <small v-if="item.isDefault">系統預設</small>
            <small v-else>同功能圖標</small>
          </button>
        </div>
        <div class="fc-icon-library-upload">
          <div>
            <strong>自訂圖標</strong>
            <span>支援 PNG、JPG、WebP、SVG</span>
          </div>
          <label class="fc-upload-trigger">
            <span>上傳圖標</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="handleTopNavIconChange($event, iconLibraryTarget)" />
          </label>
        </div>
      </div>
    </n-modal>

    <n-modal v-model:show="gamePickerVisible" preset="card" class="fc-game-picker-modal" title="選擇子遊戲">
      <div v-if="gamePickerTarget" class="fc-game-picker">
        <div class="fc-game-picker-head">
          <strong>{{ gamePickerTarget.venue.name }}／{{ gamePickerTarget.subcategory.name }}</strong>
          <span>主大類 → 供應商 → 子遊戲</span>
        </div>
        <div class="fc-game-picker-columns">
          <section class="fc-game-picker-column">
            <div class="fc-game-picker-column-head">
              <strong>主大類</strong>
              <button type="button" @click="toggleAllGamePickerMainCategories">{{ gamePickerMainCategoryIds.length === gameMainCategoryCatalog.length ? '取消全選' : '全選' }}</button>
            </div>
            <label v-for="item in gameMainCategoryCatalog" :key="item.id" class="fc-game-picker-option">
              <input type="checkbox" :checked="gamePickerMainCategoryIds.includes(item.id)" @change="toggleGamePickerMainCategory(item.id, checkedValue($event))" />
              <span>{{ item.name }}</span>
            </label>
          </section>
          <section class="fc-game-picker-column">
            <div class="fc-game-picker-column-head">
              <strong>遊戲供應商</strong>
              <button type="button" :disabled="!gamePickerProviders.length" @click="toggleAllGamePickerProviders">{{ gamePickerProviders.length > 0 && gamePickerProviders.every((item) => gamePickerProviderIds.includes(item.id)) ? '取消全選' : '全選' }}</button>
            </div>
            <label v-for="item in gamePickerProviders" :key="item.id" class="fc-game-picker-option">
              <input type="checkbox" :checked="gamePickerProviderIds.includes(item.id)" @change="toggleGamePickerProvider(item.id, checkedValue($event))" />
              <span>{{ item.name }}</span>
            </label>
            <n-empty v-if="!gamePickerProviders.length" description="先選主大類" :show-icon="false" />
          </section>
          <section class="fc-game-picker-column fc-game-picker-column--games">
            <div class="fc-game-picker-column-head">
              <strong>子遊戲（{{ gamePickerResults.length }}）</strong>
              <button type="button" :disabled="!gamePickerResults.length" @click="toggleAllGamePickerGames">{{ gamePickerAllResultsSelected ? '取消全選' : '全選目前結果' }}</button>
            </div>
            <n-input v-model:value="gamePickerSearch" size="small" clearable placeholder="搜尋遊戲名稱／供應商" />
            <div class="fc-game-picker-list">
              <label v-for="item in gamePickerResults" :key="item.id" class="fc-game-picker-option">
                <input type="checkbox" :checked="gamePickerGameIds.includes(item.id)" @change="toggleGamePickerGame(item.id, checkedValue($event))" />
                <span>{{ item.name }}<small>{{ item.providerName }}<b v-if="item.available === false">不可用</b></small></span>
              </label>
              <n-empty v-if="!gamePickerResults.length" description="沒有符合結果" :show-icon="false" />
            </div>
          </section>
        </div>
        <div class="fc-game-picker-footer">
          <span>已選 {{ gamePickerGameIds.length }} 款</span>
          <n-space>
            <n-button @click="gamePickerVisible = false">取消</n-button>
            <n-button type="primary" @click="saveGamePicker">套用選擇</n-button>
          </n-space>
        </div>
        <div class="fc-game-picker-upload">
          <div>
            <strong>遊戲清單上傳</strong>
            <span>CSV／TXT，一行一筆遊戲 ID 或名稱</span>
          </div>
          <label class="fc-upload-trigger fc-upload-trigger--small">
            <span>上傳清單</span>
            <input type="file" accept=".csv,.txt,text/csv,text/plain" @change="handleGameListUpload" />
          </label>
        </div>
      </div>
    </n-modal>

    <n-modal v-model:show="copyDialogVisible" preset="card" class="fc-copy-modal" title="複製終端配置衝突">
      <p class="fc-helper">逐項選擇保留目前終端內容或套用來源終端內容。取消時不修改目前草稿。</p>
      <n-list>
        <n-list-item v-for="conflict in copyConflicts" :key="conflict.targetId">
          <div class="fc-conflict-row">
            <div>
              <strong>{{ conflict.source.label }}</strong>
              <span>目前：{{ conflict.current.label }}／來源：{{ conflict.source.variant }}</span>
            </div>
            <n-space size="small">
              <n-button size="small" :type="conflict.choice === 'current' ? 'primary' : 'default'" secondary @click="conflict.choice = 'current'">保留目前
              </n-button>
              <n-button size="small" :type="conflict.choice === 'source' ? 'primary' : 'default'" secondary @click="conflict.choice = 'source'">套用來源
              </n-button>
            </n-space>
          </div>
        </n-list-item>
      </n-list>
      <template #footer>
        <n-space justify="end">
          <n-button @click="copyDialogVisible = false">取消
          </n-button>
          <n-button type="primary" @click="applyCopyResult">立即套用</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-drawer v-model:show="versionsVisible" :width="420" placement="right">
      <n-drawer-content title="版本抽屜">
        <n-list>
          <n-list-item v-for="(platform, key) in platformMeta" :key="key">
            <div class="fc-version-row">
              <div>
                <strong>{{ platform.label }}</strong>
                <span>{{ configs[key].templateId || '未選模板' }}{{ configs[key].isCustomTemplate ? '／自定義模板' : '' }}／最後修改 {{ lastModifiedByPlatform[key] }}</span>
              </div>
              <n-space size="small" align="center">
                <n-tag size="small" :type="statusTagType(statusByPlatform[key])" :bordered="false">{{ statusByPlatform[key] }}
                </n-tag>
                <strong>{{ platform.short }}-D{{ String(versions[key]).padStart(2, '0') }}</strong>
              </n-space>
            </div>
            <div v-for="record in sortedVersionHistory(key)" :key="`${key}-${record.version}`" class="fc-version-history-row">
              <div>
                <strong>{{ platform.short }}-D{{ String(record.version).padStart(2, '0') }}</strong>
                <span>最後修改 {{ record.lastModifiedAt }}／{{ record.modifiedBy }}</span>
                <span v-if="record.actualPublishedAt || record.publishedAt">實際發布 {{ record.actualPublishedAt || record.publishedAt }}</span>
                <span v-if="record.scheduledAt">預定發布 {{ record.scheduledAt }}</span>
                <span v-if="record.failureAt">發布失敗 {{ record.failureAt }}／{{ record.failureReason || '未提供原因' }}</span>
                <span v-if="record.frontendState">前台：{{ record.frontendState }}{{ record.stablePublishedVersion ? `（${platform.short}-D${String(record.stablePublishedVersion).padStart(2, '0')}）` : '' }}</span>
                <span v-if="record.retryCount">重試 {{ record.retryCount }} 次</span>
                <span v-if="record.systemReportedAt">已回報系統 {{ record.systemReportedAt }}／{{ record.systemReportRecipients?.join('、') }}</span>
                <span v-if="record.rejectionReason">退回：{{ record.rejectionReason }}</span>
              </div>
              <n-button v-if="isRollbackAvailable(key, record)" size="tiny" secondary @click="requestRollback(key, record.version)">申請回滾</n-button>
            </div>
          </n-list-item>
        </n-list>
        <n-alert type="info" :bordered="false">每個終端獨立產生版本號；回滾只處理目前版本之前的已發布版本，並需重新審批。</n-alert>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, type Component, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NAlert,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NList,
  NListItem,
  NModal,
  NSpace,
  NStep,
  NSteps,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  NText,
  useDialog,
  useMessage,
} from 'naive-ui';
import { readStoredDraft, readStoredSharedLayout, setStoredDraft, setStoredDraftPayload, setStoredSharedLayout } from './draftState';
import { getMerchantSeed, getSharedLayout, getSharedLayoutReferences, publishedTemplateByMerchant } from './data';
import { themeCatalog, themeOptions } from './themeCatalog';
import ModuleWireframe from './ModuleWireframe.vue';
import topNav01Source from '../../../assets/topnav/Topnav-01.svg';
import topNav02Source from '../../../assets/topnav/Topnav-02.svg';
import topNav03Source from '../../../assets/topnav/Topnav-03.svg';
import topNav04Source from '../../../assets/topnav/Topnav-04.svg';
import topNav05Source from '../../../assets/topnav/Topnav-05.svg';
import topNav06Source from '../../../assets/topnav/Topnav-06.svg';
import topNav07Source from '../../../assets/topnav/Topnav-07.svg';
import {
  ArrowDownCircleOutline,
  CloudDownloadOutline,
  Download,
  DownloadOutline,
  Gift,
  GiftOutline,
  GameControllerOutline,
  Headset,
  HeadsetOutline,
  HomeOutline,
  Language,
  LanguageOutline,
  Notifications,
  NotificationsCircleOutline,
  NotificationsOffOutline,
  NotificationsOutline,
  Person,
  PersonCircleOutline,
  PersonOutline,
  Search,
  SearchCircleOutline,
  SearchOutline,
  Wallet,
  WalletOutline,
  WalletSharp,
} from '@vicons/ionicons5';

type Platform = 'desktop' | 'mobile' | 'app';
type AuthState = 'loggedOut' | 'loggedIn';
type ModuleType = 'topNav' | 'screenBanner' | 'bottomNav' | 'banner' | 'notice' | 'category' | 'games' | 'info' | 'function' | 'footer' | 'floating';
type ModuleCategory = 'topNav' | 'banner' | 'gameEntry' | 'games' | 'screenBanner' | 'floating' | 'rank' | 'winner' | 'footer' | 'bottomNav' | 'jackpot' | 'marquee' | 'member' | 'wallet' | 'secondaryBanner' | 'social' | 'custom';
type Zone = 'top' | 'content' | 'footer' | 'bottom' | 'floating';
type Status = '草稿' | '待審批' | '已審批' | '排程中' | '已發布' | '發布失敗';

interface CustomDisplaySlot {
  id: string;
  imageName: string;
  imageSource: string;
}

type GameDisplayMode = 'iconText' | 'icon' | 'text';

interface GameSourceOption {
  id: string;
  name: string;
  mainCategoryIds: string[];
  providerId: string;
  providerName: string;
  available?: boolean;
}

interface GameSubcategoryConfig {
  id: string;
  name: string;
  mainCategoryIds: string[];
  providerIds: string[];
  gameIds: string[];
  displayMode: GameDisplayMode;
  iconVisible: boolean;
  iconKey?: string;
  iconName?: string;
  iconSource?: string;
}

interface GameVenueConfig {
  id: string;
  name: string;
  subcategories: GameSubcategoryConfig[];
}

type PageColumnCount = 1 | 2 | 3;
type PageContentWidth = 1920 | 1440 | 1200 | 1080;

interface PageLayoutConfig {
  outerWidth: 1920;
  sideNavEnabled: boolean;
  bottomNavEnabled: boolean | null;
  columns: PageColumnCount;
  contentWidth: PageContentWidth;
  columnRatio: string;
  columnGap: number;
  themeId: string;
  authState: AuthState;
  gameVenues: GameVenueConfig[];
}

interface Descriptor {
  type: ModuleType;
  variant: string;
  label: string;
  detail: string;
  referenceAsset?: string;
  sourceVariant?: string;
  interaction?: 'switch' | 'secondaryPage';
  zone: Zone;
  slot: string;
  category?: ModuleCategory;
  required?: boolean;
}

interface ModuleConfig extends Descriptor {
  id: string;
  ratio: string;
  sourceTemplateId?: string;
  isCustomModule?: boolean;
  bannerCount?: number;
  bannerAlign?: 'left' | 'center' | 'right';
  floatingEdge?: 'top' | 'right' | 'bottom' | 'left';
  floatingOffset?: number;
  floatingPageKeys?: string[];
  floatingIconFunction?: string;
  floatingIconKey?: string;
  floatingIconName?: string;
  floatingIconSource?: string;
  noticeIconName?: string;
  noticeIconSource?: string;
  noticeIconKey?: string;
  logoName?: string;
  logoSource?: string;
  buttonKeys?: string[];
  buttonIconNames?: Record<string, string>;
  buttonIconSources?: Record<string, string>;
  buttonIconKeys?: Record<string, string>;
  primaryButton?: 'login' | 'register';
  showAuthBar?: boolean;
  bottomNavItems?: BottomNavEntryConfig[];
  rtpEnabled?: boolean;
  entryDisplayMode?: GameDisplayMode;
  iconVisible?: boolean;
  gameVenues?: GameVenueConfig[];
  customDisplayRows?: number;
  customDisplayColumns?: number;
  customDisplaySlots?: CustomDisplaySlot[];
}

interface BottomNavEntryConfig {
  key: string;
  label: string;
  route: string;
  activeIconKey: string;
  inactiveIconKey: string;
  activeIconName?: string;
  inactiveIconName?: string;
  activeIconSource?: string;
  inactiveIconSource?: string;
}

interface HomeConfig {
  templateId: string;
  isCustomTemplate: boolean;
  pageLayout: PageLayoutConfig;
  modules: ModuleConfig[];
}

interface VersionRecord {
  version: number;
  status: Status;
  lastModifiedAt: string;
  editedBy: string;
  modifiedBy: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  actualPublishedAt?: string;
  scheduledAt?: string;
  failureAt?: string;
  failureReason?: string;
  retryCount: number;
  retryHistory: string[];
  systemReportedAt?: string;
  systemReportRecipients?: string[];
  scheduleHistory: string[];
  rejectionReason?: string;
  rollbackTargetVersion?: number;
  approvalRuleSnapshot?: string;
  frontendState?: '維持前一版本' | '已切換至本版本';
  stablePublishedVersion?: number;
  config?: HomeConfig;
}

interface BatchHandoff {
  mode: 'new' | 'apply';
  sourceMerchantId?: string;
  platforms: Platform[];
  sourcePublishedByPlatform?: Partial<Record<Platform, string>>;
  sourceTemplateByPlatform?: Partial<Record<Platform, string>>;
  createdAt: string;
}

interface StoredDraftSnapshot {
  configs: Partial<Record<Platform, HomeConfig>>;
  versions?: Partial<Record<Platform, number>>;
  statusByPlatform?: Partial<Record<Platform, Status>>;
  previewed?: Partial<Record<Platform, boolean>>;
  lastModifiedByPlatform?: Partial<Record<Platform, string>>;
  versionHistoryByPlatform?: Partial<Record<Platform, VersionRecord[]>>;
  preserveVersionOnSave?: Partial<Record<Platform, boolean>>;
  batchHandoff?: BatchHandoff;
}

interface SharedLayoutStoredSnapshot {
  layoutId: string;
  platform: Platform;
  templateId: string;
  config: HomeConfig;
  version: number;
  status: Status;
  previewed: boolean;
  lastModifiedAt: string;
  versionHistory: VersionRecord[];
}

interface LibraryItem {
  type: ModuleType;
  variant: string;
  label: string;
  note: string;
  interaction?: 'switch' | 'secondaryPage';
  symbol: string;
  zone: Zone;
  category?: ModuleCategory;
  compatibility: 'ready' | 'tbd';
  referenceAsset?: string;
  sourceVariant?: string;
}

interface LayoutCatalogItem {
  home: string;
  profile: string;
  sites: string[];
  label: string;
  structure: string;
  status: 'ready' | 'tbd';
}

interface CopyConflict {
  source: ModuleConfig;
  current: ModuleConfig;
  targetId: string;
  choice: 'current' | 'source';
}

interface ModuleSettingScope {
  source: string;
  configurable: string;
  readonly: string;
}

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const tenantId = String(route.params.tenantId || '');
const isNewFlow = route.query.mode === 'new';
const isApplyFlow = route.query.mode === 'apply';
const isSharedEditFlow = route.query.mode === 'shared-edit';
const applySourceMerchantId = String(route.query.sourceMerchantId || '');
const sharedLayoutId = String(route.query.sharedLayoutId || '');
const sharedTemplateId = String(route.query.sharedTemplateId || '');

const platformMeta = {
  desktop: { label: '桌面版', short: 'PC', resolution: '1920 × 1080' },
  mobile: { label: '行動版', short: 'H5', resolution: '375 × 812' },
  app: { label: 'APP', short: 'APP', resolution: '375 × 812' },
} as const;
const platformKeys = Object.keys(platformMeta) as Platform[];
const requestedPlatform = String(route.query.platform || 'desktop');
const sourceDraft = isApplyFlow && applySourceMerchantId ? readStoredDraft<StoredDraftSnapshot>(applySourceMerchantId) : null;
const sharedStored = isSharedEditFlow && sharedLayoutId
  ? readStoredSharedLayout<SharedLayoutStoredSnapshot>(sharedLayoutId, requestedPlatform)
  : null;
const storedDraft = !isNewFlow && !isApplyFlow && !isSharedEditFlow ? readStoredDraft<StoredDraftSnapshot>(tenantId) : null;
const batchHandoff = storedDraft?.batchHandoff;
const batchSourceDraft = batchHandoff?.sourceMerchantId
  ? readStoredDraft<StoredDraftSnapshot>(batchHandoff.sourceMerchantId)
  : null;
const platformOptions = platformKeys
  .filter((value) => !isSharedEditFlow || value === requestedPlatform)
  .map((value) => ({
  label: `${platformMeta[value].short}／${platformMeta[value].label}`,
  value,
}));
interface FloatingPageOption {
  key: string;
  label: string;
}
interface FloatingPageGroup {
  key: string;
  label: string;
  pages: FloatingPageOption[];
}
const floatingPageGroups: FloatingPageGroup[] = [
  { key: 'auth', label: '登入註冊', pages: ['login', 'register', 'rpwd'].map((key) => ({ key, label: key })) },
  { key: 'activity', label: '活動中心', pages: ['activity', 'ActivityDetail', 'FirstRecharge', 'DailyTasks', 'DailySignIn', 'PointMall', 'Turntable', 'Bonus', 'Championship'].map((key) => ({ key, label: key })) },
  { key: 'games', label: '遊戲二級頁', pages: ['AllGames', 'AllOnlineGames', 'Lottery', 'Slots', 'Casino', 'Chess', 'Fishing', 'FishGames', 'eSports', 'Original'].map((key) => ({ key, label: key })) },
  { key: 'lottery', label: '彩票遊戲', pages: ['WinGo', 'TrxWinGo', 'K3', '5D', '4D', 'Bingo', 'XoSo', 'SaasLottery'].map((key) => ({ key, label: key })) },
  { key: 'wallet', label: '錢包充提', pages: ['wallet', 'Recharge', 'Withdraw', 'RechargeHistory', 'WithdrawHistory', 'TransAction', 'USDT', 'UPI', 'PIX', 'C2C'].map((key) => ({ key, label: key })) },
  { key: 'vip', label: 'VIP與洗碼', pages: ['vip', 'RebateDetails', 'main/Laundry', 'RecordVsruleHistory'].map((key) => ({ key, label: key })) },
  { key: 'promotion', label: '推廣代理', pages: ['promotion', 'PromotionShare', 'RebateRatio', 'MyInvitation', 'TeamReport', 'CommissionDetail', 'TeamPartner', 'Server'].map((key) => ({ key, label: key })) },
  { key: 'member', label: '會員中心', pages: ['main', 'CustomerService', 'About', 'Guide', 'Notification', 'SettingCenter', 'StrongBox', 'RedeemGift', 'Feedback'].map((key) => ({ key, label: key })) },
  { key: 'download', label: 'PWA與下載', pages: ['installApp', 'downloadCenter', 'DownloadPWA'].map((key) => ({ key, label: key })) },
];
const allFloatingPageKeys = floatingPageGroups.flatMap((group) => group.pages.map((page) => page.key));
const pageWidthOptions = [
  { label: '1920px', value: 1920 },
  { label: '1440px', value: 1440 },
  { label: '1200px', value: 1200 },
  { label: '1080px', value: 1080 },
];
const pageColumnOptions = [
  { label: '1 欄', value: 1 },
  { label: '2 欄', value: 2 },
  { label: '3 欄', value: 3 },
];
const bannerRatios = ['69:38', '23:10', '351:160', '351:190', '375:169', '702:287', '672:317', '43:20', '117:50', '138:59', '69:32'];
const bannerAlignOptions = [
  { label: '靠左', value: 'left' },
  { label: '置中', value: 'center' },
  { label: '靠右', value: 'right' },
];
const gameMainCategoryCatalog = [
  { id: 'casino', name: 'Casino' },
  { id: 'slots', name: '電子' },
  { id: 'live', name: '真人' },
  { id: 'lottery', name: '彩票' },
  { id: 'sports', name: '體育' },
  { id: 'fishing', name: '捕魚' },
];
const gameProviderCatalog = [
  { id: 'pg', name: 'PG Soft', mainCategoryIds: ['casino', 'slots'] },
  { id: 'jdb', name: 'JDB', mainCategoryIds: ['casino', 'slots', 'fishing'] },
  { id: 'evolution', name: 'Evolution', mainCategoryIds: ['live'] },
  { id: 'sexy', name: 'SEXY', mainCategoryIds: ['live'] },
  { id: 'lottery-core', name: 'Lottery Core', mainCategoryIds: ['lottery'] },
  { id: 'sport-core', name: 'Sport Core', mainCategoryIds: ['sports'] },
];
const gameCatalog: GameSourceOption[] = Array.from({ length: 60 }, (_, index) => {
  const provider = gameProviderCatalog[index % gameProviderCatalog.length];
  const mainCategoryId = provider.mainCategoryIds[index % provider.mainCategoryIds.length];
  return {
    id: `game-${String(index + 1).padStart(3, '0')}`,
    name: `${provider.name} 遊戲 ${String(index + 1).padStart(3, '0')}`,
    mainCategoryIds: [mainCategoryId],
    providerId: provider.id,
    providerName: provider.name,
    available: index !== 11,
  };
});
const gameDisplayModeOptions = [
  { label: '圖標＋文字', value: 'iconText' as GameDisplayMode },
  { label: '純圖標', value: 'icon' as GameDisplayMode },
  { label: '純文字', value: 'text' as GameDisplayMode },
];
interface TopNavButtonDefinition {
  key: string;
  label: string;
  note: string;
  icon: Component;
  required?: boolean;
}
interface TopNavIconOption {
  key: string;
  label: string;
  icon: Component;
  isDefault?: boolean;
}
const topNavButtonCatalog: TopNavButtonDefinition[] = [
  { key: 'notification', label: '通知', note: '消息中心入口', icon: NotificationsOutline, required: true },
  { key: 'download', label: '下載', note: 'App／PWA 下載入口', icon: DownloadOutline, required: true },
  { key: 'customerService', label: '客服', note: '客服入口', icon: HeadsetOutline },
  { key: 'language', label: '語言', note: '語言切換入口', icon: LanguageOutline },
  { key: 'wallet', label: '錢包', note: '錢包入口', icon: WalletOutline },
  { key: 'user', label: '會員', note: '登入／會員入口', icon: PersonOutline },
  { key: 'search', label: '搜尋', note: '搜尋入口', icon: SearchOutline },
  { key: 'gift', label: '活動', note: '活動入口', icon: GiftOutline },
];
const topNavIconLibrary: Record<string, TopNavIconOption[]> = {
  notification: [
    { key: 'notification', label: '預設圖標', icon: NotificationsOutline, isDefault: true },
    { key: 'notification-filled', label: '實心通知', icon: Notifications },
    { key: 'notification-circle', label: '圓形通知', icon: NotificationsCircleOutline },
    { key: 'notification-off', label: '通知提示', icon: NotificationsOffOutline },
  ],
  download: [
    { key: 'download', label: '預設圖標', icon: DownloadOutline, isDefault: true },
    { key: 'download-filled', label: '實心下載', icon: Download },
    { key: 'download-cloud', label: '雲端下載', icon: CloudDownloadOutline },
    { key: 'download-circle', label: '圓形下載', icon: ArrowDownCircleOutline },
  ],
  customerService: [
    { key: 'customerService', label: '預設圖標', icon: HeadsetOutline, isDefault: true },
    { key: 'customerService-filled', label: '實心客服', icon: Headset },
  ],
  language: [
    { key: 'language', label: '預設圖標', icon: LanguageOutline, isDefault: true },
    { key: 'language-filled', label: '實心語言', icon: Language },
  ],
  wallet: [
    { key: 'wallet', label: '預設圖標', icon: WalletOutline, isDefault: true },
    { key: 'wallet-filled', label: '實心錢包', icon: Wallet },
    { key: 'wallet-sharp', label: '銳角錢包', icon: WalletSharp },
  ],
  user: [
    { key: 'user', label: '預設圖標', icon: PersonOutline, isDefault: true },
    { key: 'user-filled', label: '實心會員', icon: Person },
    { key: 'user-circle', label: '圓形會員', icon: PersonCircleOutline },
  ],
  search: [
    { key: 'search', label: '預設圖標', icon: SearchOutline, isDefault: true },
    { key: 'search-filled', label: '實心搜尋', icon: Search },
    { key: 'search-circle', label: '圓形搜尋', icon: SearchCircleOutline },
  ],
  gift: [
    { key: 'gift', label: '預設圖標', icon: GiftOutline, isDefault: true },
    { key: 'gift-filled', label: '實心活動', icon: Gift },
  ],
};
const bottomNavEntryCatalog = [
  { key: 'home', label: '首頁', route: '/home', icon: HomeOutline },
  { key: 'games', label: '遊戲', route: '/all-games', icon: GameControllerOutline },
  { key: 'promotion', label: '優惠', route: '/promotion', icon: GiftOutline },
  { key: 'wallet', label: '錢包', route: '/wallet', icon: WalletOutline },
  { key: 'main', label: '我的', route: '/main', icon: PersonOutline },
] as const;
const bottomNavEntryKeysByVariant: Record<string, string[]> = { rajaTab: ['promotion', 'wallet', 'home', 'main'] };
const bottomNavIconLibrary: Record<string, TopNavIconOption[]> = {
  home: [{ key: 'home-outline', label: '未啟用／線框', icon: HomeOutline, isDefault: true }, { key: 'home-filled', label: '啟用／實心', icon: HomeOutline }],
  games: [{ key: 'games-outline', label: '未啟用／線框', icon: GameControllerOutline, isDefault: true }, { key: 'games-filled', label: '啟用／實心', icon: GameControllerOutline }],
  promotion: [{ key: 'promotion-outline', label: '未啟用／線框', icon: GiftOutline, isDefault: true }, { key: 'promotion-filled', label: '啟用／實心', icon: Gift }],
  wallet: [{ key: 'wallet-outline', label: '未啟用／線框', icon: WalletOutline, isDefault: true }, { key: 'wallet-filled', label: '啟用／實心', icon: Wallet }],
  main: [{ key: 'main-outline', label: '未啟用／線框', icon: PersonOutline, isDefault: true }, { key: 'main-filled', label: '啟用／實心', icon: Person }],
};
const floatingIconFunctionCatalog = [
  { key: 'rewardCenter', label: '獎勵中心' },
  { key: 'invitedWheel', label: '邀請轉盤' },
  { key: 'bigTurntable', label: '大轉盤' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'changlong', label: '長龍' },
];
const floatingIconLibrary: Record<string, TopNavIconOption[]> = {
  rewardCenter: [
    { key: 'rewardCenter', label: '預設圖標', icon: GiftOutline, isDefault: true },
    { key: 'rewardCenter-filled', label: '實心獎勵', icon: Gift },
  ],
  invitedWheel: [
    { key: 'invitedWheel', label: '預設圖標', icon: ArrowDownCircleOutline, isDefault: true },
    { key: 'invitedWheel-filled', label: '實心轉盤', icon: Gift },
  ],
  bigTurntable: [
    { key: 'bigTurntable', label: '預設圖標', icon: ArrowDownCircleOutline, isDefault: true },
    { key: 'bigTurntable-filled', label: '實心轉盤', icon: Gift },
  ],
  telegram: [
    { key: 'telegram', label: '預設圖標', icon: NotificationsOutline, isDefault: true },
    { key: 'telegram-filled', label: '實心入口', icon: Notifications },
  ],
  changlong: [
    { key: 'changlong', label: '預設圖標', icon: HeadsetOutline, isDefault: true },
    { key: 'changlong-filled', label: '實心入口', icon: Headset },
  ],
};
const noticeIconLibrary: TopNavIconOption[] = [
  { key: 'notice', label: '預設公告', icon: NotificationsOutline, isDefault: true },
  { key: 'notice-filled', label: '實心公告', icon: Notifications },
  { key: 'notice-circle', label: '圓形公告', icon: NotificationsCircleOutline },
  { key: 'notice-off', label: '公告提示', icon: NotificationsOffOutline },
];
const gameEntryIconLibrary: TopNavIconOption[] = [
  { key: 'games-outline', label: '預設遊戲', icon: GameControllerOutline, isDefault: true },
  { key: 'games-filled', label: '實心遊戲', icon: GameControllerOutline },
  { key: 'casino', label: '場館', icon: GiftOutline },
  { key: 'casino-filled', label: '實心場館', icon: Gift },
];
const layoutCatalog: LayoutCatalogItem[] = [
  { home: 'redHome', profile: 'coreLobby', sites: ['AR003', 'AR012', 'AR013', 'AR036'], label: 'redHome／品牌 Lobby', structure: '品牌導航（Logo／通知／下載）→ 滿版 Banner → 公告列 → 遊戲大類入口（原頁切換）→ 遊戲分類（跳二級頁）→ BigAward（條件）→ Winner／Rank → Footer', status: 'ready' },
  { home: 'public6Home', profile: 'coreLobby', sites: ['AR092'], label: 'public6Home／個人資訊 Lobby', structure: '下載推廣資訊條／NavBar → Banner → Notice → 個人資訊列 → Game → Winner／Rank', status: 'ready' },
  { home: 'blackGoldHome', profile: 'coreLobby', sites: ['AR016', 'AR055', 'AR097'], label: 'blackGoldHome／黑金 Lobby', structure: 'NavBar 登入／語言 → Banner → Notice → Game → Winner／Rank', status: 'ready' },
  { home: 'blueHome', profile: 'blueLobby', sites: ['AR007', 'AR015', 'AR022', 'AR033', 'AR035', 'AR037', 'AR047', 'AR059'], label: 'blueHome／八類入口 Lobby', structure: 'NavBar → Banner → 公告列 → GameMenu 八個入口（頂列 2 個）→ GameList → Winner／Rank', status: 'ready' },
  { home: 'ar004', profile: 'blueLobby', sites: ['AR004'], label: 'ar004／BlueHome 變體', structure: 'NavBar → Banner → Notice → GameMenu → GameList → Winner／Rank', status: 'ready' },
  { home: 'red92Home', profile: 'containerLobby', sites: ['AR001', 'AR040', 'AR043', 'AR044', 'AR045', 'AR046'], label: 'red92Home／92 Lobby', structure: 'NavBar → Banner → Notice → 遊戲大類入口（原頁切換）→ 遊戲分類（跳二級頁）→ Winner／Rank', status: 'ready' },
  { home: 'whiteGoldHome', profile: 'containerLobby', sites: ['AR042'], label: 'whiteGoldHome／白金 Lobby', structure: 'NavBar → LoginTip → Banner → Notice → GameMenu → GameContainer → Winner／Rank', status: 'ready' },
  { home: 'whiteGoldBigMumbai', profile: 'containerLobby', sites: ['AR041'], label: 'whiteGoldBigMumbai／白金 BigMumbai', structure: 'NavBar → Banner → Notice → GameMenu → BigMumbai GameContainer → Winner／Rank', status: 'ready' },
  { home: 'electronic', profile: 'electronicLobby', sites: ['AR019', 'AR023', 'AR031', 'AR039', 'AR070', 'AR071', 'AR074', 'AR081', 'AR082', 'AR086'], label: 'electronic／電子遊戲型', structure: 'NavBar → Banner → Notice → Tabs → AloneGame 分段 → Winning／Profit／Instructions', status: 'ready' },
  { home: 'blackElectronic', profile: 'electronicLobby', sites: ['AR038'], label: 'blackElectronic／黑電子變體', structure: 'NavBar → Banner → Notice → Tabs → Slot／Video／AloneGame → Winning／Profit → Footer', status: 'ready' },
  { home: 'red096Home', profile: 'electronicLobby', sites: ['AR096'], label: 'red096Home／Menu 電子型', structure: 'NavBar → Banner → Notice → MenuItem → AloneGame 分段 → Winning／Profit／Instructions', status: 'ready' },
  { home: 'damanHome', profile: 'damanLobby', sites: ['AR002', 'AR011', 'AR050', 'AR051', 'AR052'], label: 'damanHome／Daman 場景型', structure: 'NavBar → Banner → NoticeDaman → GameScenes → Winner／Rank → Terms', status: 'ready' },
  { home: 'goGameHome', profile: 'goGameLobby', sites: ['AR009', 'AR026', 'AR068'], label: 'goGameHome／GO Game 場景型', structure: 'GO Game Nav → GO Game Banner → Notice → GameScenes → Terms', status: 'ready' },
  { home: 'public3Home', profile: 'publicLobby', sites: ['AR034', 'AR058', 'AR062', 'AR065', 'AR067', 'AR069', 'AR072', 'AR076', 'AR078', 'AR080', 'AR085', 'AR087', 'AR089', 'AR090', 'AR098'], label: 'public3Home／公版三', structure: 'NavBar（搜尋／錢包／通知／會員）→ PC 側邊導航 → Banner → 公告 → 快捷卡 → Winner／Rank／BigAward → GameList → Team', status: 'ready' },
  { home: 'okwinHome2', profile: 'publicLobby', sites: ['AR064', 'AR077'], label: 'okwinHome2／Okwin', structure: 'NavBar → 專用 Banner → 公告 → 錢包／快捷 → GameList → Winner → Rank → Team', status: 'ready' },
  { home: 'public5BlackGoldHome', profile: 'publicLobby', sites: ['AR079', 'AR088', 'AR091'], label: 'public5BlackGoldHome／黑金', structure: 'NavBar → Banner → Notice → Winner → Game → Rank → Team', status: 'ready' },
  { home: 'rajaHome', profile: 'publicLobby', sites: ['AR008'], label: 'rajaHome／Raja', structure: 'NavBar → Notice → Banner → Game → BigAward → Winner／Rank → Team', status: 'ready' },
  { home: '91club', profile: 'clubLobby', sites: ['AR021', 'AR048'], label: '91club／Club Lobby', structure: 'NavBar → Notice → Banner → 品牌快捷 → Game → Winner／Rank → Team', status: 'ready' },
  { home: 'ar014', profile: 'clubLobby', sites: ['AR014'], label: 'ar014／Club 變體', structure: 'NavBar → Notice → Banner → 品牌快捷 → Game → Winner／Rank', status: 'ready' },
  { home: 'public5WhiteGreenHome', profile: 'whiteGreenLobby', sites: ['AR095'], label: 'public5WhiteGreenHome／白綠 Lobby', structure: 'Nav → Login／Register → NoticeBar → Banner → ActivityCards → GameList → Terms；Turntable／DownloadPWA為浮標入口', status: 'ready' },
  { home: 'public7Home', profile: 'public7Lobby', sites: ['AR093'], label: 'public7Home／Public7 Lobby', structure: 'Nav → Banner → NoticeBar → GameCategoryTabs → GameSection → Recommended → Featured → Winner／Rank → Partner；Turntable為浮標入口', status: 'ready' },
];
// The source library keeps seven numbered SVGs for traceability. The editor
// exposes shared structural variants and stores the source number separately.
type TopNavVariant = 'dualAuth' | 'wideLogo' | 'topnav05' | 'topnav06' | 'topnav07';
type TopNavSourceVariant = 'topnav01' | 'topnav02' | 'topnav03' | 'topnav04' | 'topnav05' | 'topnav06' | 'topnav07';
const topNavSourceFormByTemplate: Record<string, TopNavSourceVariant> = {
  redHome: 'topnav01',
  ar004: 'topnav01',
  blueHome: 'topnav01',
  whiteGoldHome: 'topnav01',
  whiteGoldBigMumbai: 'topnav01',
  damanHome: 'topnav02',
  rajaHome: 'topnav02',
  ar014: 'topnav02',
  '91club': 'topnav02',
  red92Home: 'topnav03',
  blackGoldHome: 'topnav03',
  public5BlackGoldHome: 'topnav03',
  red096Home: 'topnav04',
  public3Home: 'topnav04',
  blackElectronic: 'topnav04',
  public6Home: 'topnav05',
  public5WhiteGreenHome: 'topnav05',
  goGameHome: 'topnav06',
  electronic: 'topnav06',
  okwinHome2: 'topnav06',
  public7Home: 'topnav07',
};
const topNavFormByTemplate: Record<string, TopNavVariant> = Object.fromEntries(
  Object.entries(topNavSourceFormByTemplate).map(([templateId, sourceVariant]) => [
    templateId,
    sourceVariant === 'topnav01' || sourceVariant === 'topnav02'
      ? 'dualAuth'
      : sourceVariant === 'topnav03' || sourceVariant === 'topnav04'
        ? 'wideLogo'
        : sourceVariant,
  ]),
) as Record<string, TopNavVariant>;
const topNavReferenceAssetByVariant: Record<string, string> = {
  dualAuth: topNav01Source,
  wideLogo: topNav03Source,
  topnav01: topNav01Source,
  topnav02: topNav02Source,
  topnav03: topNav03Source,
  topnav04: topNav04Source,
  topnav05: topNav05Source,
  topnav06: topNav06Source,
  topnav07: topNav07Source,
};
function topNavSourceVariant(module: Pick<ModuleConfig, 'variant' | 'sourceVariant' | 'primaryButton' | 'showAuthBar'>): TopNavSourceVariant | undefined {
  if (module.variant === 'dualAuth') return module.primaryButton === 'register' ? 'topnav02' : 'topnav01';
  if (module.variant === 'wideLogo') return module.showAuthBar ? 'topnav04' : 'topnav03';
  if (/^topnav0[1-7]$/.test(module.variant)) return module.variant as TopNavSourceVariant;
  return module.sourceVariant as TopNavSourceVariant | undefined;
}
function topNavSettings(variant: string, sourceVariant?: string) {
  const source = sourceVariant || variant;
  if (variant === 'topnav01' || source === 'topnav01') {
    return { variant: 'dualAuth' as TopNavVariant, sourceVariant: 'topnav01' as TopNavSourceVariant, primaryButton: 'login' as const, showAuthBar: false, referenceAsset: topNav01Source };
  }
  if (variant === 'topnav02' || source === 'topnav02') {
    return { variant: 'dualAuth' as TopNavVariant, sourceVariant: 'topnav02' as TopNavSourceVariant, primaryButton: 'register' as const, showAuthBar: false, referenceAsset: topNav02Source };
  }
  if (variant === 'topnav03' || source === 'topnav03') {
    return { variant: 'wideLogo' as TopNavVariant, sourceVariant: 'topnav03' as TopNavSourceVariant, primaryButton: undefined, showAuthBar: false, referenceAsset: topNav03Source };
  }
  if (variant === 'topnav04' || source === 'topnav04') {
    return { variant: 'wideLogo' as TopNavVariant, sourceVariant: 'topnav04' as TopNavSourceVariant, primaryButton: undefined, showAuthBar: true, referenceAsset: topNav04Source };
  }
  if (variant === 'wideLogo') return { variant: 'wideLogo' as TopNavVariant, sourceVariant: 'topnav03' as TopNavSourceVariant, primaryButton: undefined, showAuthBar: false, referenceAsset: topNav03Source };
  if (variant === 'dualAuth') return { variant: 'dualAuth' as TopNavVariant, sourceVariant: 'topnav01' as TopNavSourceVariant, primaryButton: 'login' as const, showAuthBar: false, referenceAsset: topNav01Source };
  return { variant, sourceVariant: sourceVariant as TopNavSourceVariant | undefined, referenceAsset: topNavReferenceAssetByVariant[variant] };
}
function applyTopNavSettings(module: ModuleConfig, variant = module.variant, sourceVariant?: string) {
  const settings = topNavSettings(variant, sourceVariant || module.sourceVariant);
  Object.assign(module, settings);
  module.referenceAsset = topNavReferenceAssetByVariant[topNavSourceVariant(module) || module.variant] || settings.referenceAsset;
}
const templateOptions = computed(() => layoutCatalog
  .filter((item) => activePlatform.value !== 'desktop')
  .map((item) => ({
    label: `${item.home} · ${item.sites.join('／')}`,
    value: item.home,
    disabled: item.status === 'tbd',
  })));
const copyOptions = platformKeys.map((value) => ({ label: platformMeta[value].label, value }));

const moduleCategoryMeta: Array<{ key: ModuleCategory; label: string; symbol: string; multiple?: boolean }> = [
  { key: 'topNav', label: '頂部導航模組', symbol: 'N' },
  { key: 'banner', label: 'Banner 模組', symbol: 'B' },
  { key: 'gameEntry', label: '遊戲大類入口模組', symbol: 'E' },
  { key: 'games', label: '遊戲展示模組', symbol: 'G', multiple: true },
  { key: 'screenBanner', label: '畫面頂部橫幅', symbol: 'H' },
  { key: 'floating', label: '浮標模組', symbol: '浮' },
  { key: 'rank', label: '排行榜模組', symbol: 'R' },
  { key: 'winner', label: '中獎資訊模組', symbol: 'W' },
  { key: 'footer', label: 'Footer 模組', symbol: 'F' },
  { key: 'bottomNav', label: '底部導航模組', symbol: 'D' },
  { key: 'jackpot', label: 'Super Jackpot 模組', symbol: 'J' },
  { key: 'marquee', label: '跑馬燈模組', symbol: 'M' },
  { key: 'member', label: '會員資訊模組', symbol: 'U' },
  { key: 'wallet', label: '錢包模組', symbol: 'W' },
  { key: 'secondaryBanner', label: '二級 Banner 模組', symbol: 'B' },
  { key: 'social', label: '社媒模組', symbol: 'S' },
  { key: 'custom', label: '自訂展示模組', symbol: 'C', multiple: true },
];
const defaultModuleCategory = (type: ModuleType, variant = ''): ModuleCategory => {
  if (type === 'screenBanner') return 'screenBanner';
  if (type === 'topNav') return 'topNav';
  if (type === 'banner') return 'banner';
  if (type === 'bottomNav') return 'bottomNav';
  if (type === 'floating') return 'floating';
  if (type === 'notice') return 'marquee';
  if (type === 'category') return 'gameEntry';
  if (type === 'games') return 'games';
  if (type === 'footer') return 'footer';
    if (type === 'info') {
      if (variant === 'rank') return 'rank';
      if (variant === 'winner' || variant === 'winning') return 'winner';
      if (variant === 'bigAward') return 'jackpot';
      if (variant === 'person') return 'member';
      if (variant === 'instructions') return 'games';
    }
    if (type === 'function') {
      if (variant === 'loginCta' || variant === 'loginTip') return 'member';
      if (variant === 'walletActions') return 'wallet';
      if (variant === 'quickActions') return 'wallet';
      if (variant === 'sideNav' || variant === 'settingsPanel') return 'topNav';
      if (variant === 'activityCards') return 'secondaryBanner';
      if (variant === 'social') return 'social';
      if (variant === 'turntable' || variant === 'pwa') return 'floating';
  }
  return 'custom';
};
const moduleCategory = (item: { type: ModuleType; variant?: string; category?: ModuleCategory }) => item.category || defaultModuleCategory(item.type, item.variant);
const descriptor = (type: ModuleType, variant: string, label: string, detail: string, zone: Zone, slot: string, required = false, category?: ModuleCategory, interaction?: Descriptor['interaction']): Descriptor => ({ type, variant, label, detail, zone, slot, required, category: category || defaultModuleCategory(type, variant), interaction });
const bottomNavCatalog = [
  { variant: 'index', label: 'index.vue', note: '五入口／背景圖／中心優惠入口' },
  { variant: 'index2', label: 'index2.vue', note: '五入口／中心優惠按鈕' },
  { variant: 'index3', label: 'index3.vue', note: '五入口／中心凸起入口' },
  { variant: 'index4', label: 'index4.vue', note: '五入口／深色分段導航' },
  { variant: 'index5', label: 'index5.vue', note: '五入口／背景圖／中心凸起入口' },
  { variant: 'index6', label: 'index6.vue', note: '五入口／文字型中心入口' },
  { variant: 'index7', label: 'index7.vue', note: '五入口／中心轉盤狀態' },
  { variant: 'index8', label: 'index8.vue', note: '五入口／品牌背景圖' },
  { variant: 'index9', label: 'index9.vue', note: '五入口／特殊中心入口' },
  { variant: 'ar064', label: 'ar064.vue', note: '五入口／黃色品牌圖標' },
  { variant: 'ar093', label: 'ar093.vue', note: '左右雙區／中心活動入口' },
  { variant: 'ar095', label: 'ar095.vue', note: '五入口／白綠品牌圖標' },
  { variant: 'ar096', label: 'ar096.vue', note: '五入口／品牌背景圖' },
  { variant: 'rajaTab', label: 'rajaTab.vue', note: '四入口／遊戲置中' },
  { variant: '91club', label: '91club.vue', note: '五入口／中心優惠入口' },
  { variant: 'whiteGoldP3Tab', label: 'whiteGoldP3Tab.vue', note: '五入口／白金品牌圖標' },
] as const;
const bottomNavVariantsByTemplate: Record<string, string[]> = {
  public3Home: ['index2', 'index', 'index9', 'whiteGoldP3Tab'],
  okwinHome2: ['ar064', 'index6'],
  public5BlackGoldHome: ['index7', 'index8'],
};
const bottomNavVariantByTemplate: Record<string, string> = {
  redHome: 'index', damanHome: 'index', red92Home: 'index', ar004: 'index', blueHome: 'index',
  rajaHome: 'rajaTab', goGameHome: 'index', ar014: 'index2', blackGoldHome: 'index3', electronic: 'index4',
  '91club': '91club', public3Home: 'index2', blackElectronic: 'index4', okwinHome2: 'ar064',
  public5BlackGoldHome: 'index7', public6Home: 'index', public7Home: 'ar093', public5WhiteGreenHome: 'ar095',
  red096Home: 'ar096', whiteGoldBigMumbai: 'index', whiteGoldHome: 'index',
};
const bottomNavDescriptor = (templateId = '') => {
  const variant = bottomNavVariantByTemplate[templateId] || 'index';
  const source = bottomNavCatalog.find((item) => item.variant === variant) || bottomNavCatalog[0];
  const sourceVariants = bottomNavVariantsByTemplate[templateId] || [variant];
  const sourceLabels = sourceVariants
    .map((itemVariant) => bottomNavCatalog.find((item) => item.variant === itemVariant)?.label || itemVariant)
    .join('、');
  return descriptor('bottomNav', source.variant, '底部導航', `${source.label}／${source.note}／來源形式：${sourceLabels}`, 'bottom', 'bottomNav');
};
const templateDescriptors: Record<string, Descriptor[]> = {
  coreLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('notice', 'bar', '公告列', 'NoticeBar 公告列', 'content', 'notice'), descriptor('category', 'list', '遊戲大類入口', '一般分類入口', 'content', 'gameEntry', true), descriptor('games', 'grid', '遊戲分類', '既有遊戲配置＋網格卡片', 'content', 'gameContent', true), descriptor('info', 'winner', '中獎資訊', 'LuckyWinners', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'DailyProfitRank', 'content', 'rank'), descriptor('footer', 'legal', 'Footer／資訊區', 'BottomLogoText 形式', 'footer', 'footer')],
  blueLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('notice', 'bar', '公告列', 'BlueHome NoticeBar 公告列', 'content', 'notice'), descriptor('category', 'blueMenu', '遊戲大類入口', 'BlueHome GameMenu／八個入口', 'content', 'gameEntry', true), descriptor('games', 'grid', '遊戲分類', 'BlueHome GameList', 'content', 'gameContent', true), descriptor('info', 'winner', '中獎資訊', 'LuckyWinners', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'DailyProfitRank', 'content', 'rank')],
  containerLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('notice', 'bar', '公告列', 'NoticeBar 公告列', 'content', 'notice'), descriptor('category', 'containerMenu', '遊戲大類入口', 'HomeMenu／GameMenu', 'content', 'gameEntry', true), descriptor('games', 'container', '遊戲分類', 'HomeContainer／GameContainer', 'content', 'gameContent', true), descriptor('info', 'winner', '中獎資訊', 'LuckyWinners', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'DailyProfitRank', 'content', 'rank')],
  electronicLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('notice', 'bar', '公告列', 'Electronic NoticeBar 公告列', 'content', 'notice'), descriptor('category', 'tabs', '遊戲大類入口', 'Tabs／MenuItem 分類', 'content', 'gameEntry', true), descriptor('games', 'electronic', '遊戲分類', 'AloneGame 分段內容', 'content', 'gameContent', true), descriptor('info', 'winning', '中獎資訊', 'Winning／Profit', 'content', 'winner'), descriptor('info', 'instructions', '說明資訊', 'Instructions／Slot／Video', 'content', 'info'), descriptor('footer', 'info', 'Footer／資訊區', '模板專用資訊組合', 'footer', 'footer')],
  damanLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('notice', 'daman', '公告提示', 'NoticeDaman', 'content', 'notice'), descriptor('category', 'scene', '遊戲大類入口', 'GameScenesDaman 場景分類', 'content', 'gameEntry', true), descriptor('games', 'scene', '遊戲分類', 'GameScenesDaman', 'content', 'gameContent', true), descriptor('info', 'winner', '中獎資訊', 'LuckyWinners', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'DailyProfitRank', 'content', 'rank'), descriptor('footer', 'terms', 'Footer／資訊區', 'TermsDaman／BottomLogoText', 'footer', 'footer')],
  goGameLobby: [descriptor('topNav', 'goGame', '頂部導航', 'GO Game 專用布局', 'top', 'topNav', true), descriptor('banner', 'goGame', 'Banner 模組', 'GO Game Swiper', 'content', 'banner', true), descriptor('notice', 'daman', '公告提示', 'NoticeDaman', 'content', 'notice'), descriptor('category', 'scene', '遊戲大類入口', 'GameScenesDamanNew 場景分類', 'content', 'gameEntry', true), descriptor('games', 'scene', '遊戲分類', 'GameScenesDamanNew／Home', 'content', 'gameContent', true), descriptor('footer', 'terms', 'Footer／資訊區', 'TermsDamanNew', 'footer', 'footer')],
  publicLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('notice', 'bar', '公告列', 'NoticeBar 公告列', 'content', 'notice'), descriptor('category', 'tabs', '遊戲大類入口', '分類頁籤', 'content', 'gameEntry', true), descriptor('games', 'list', '遊戲分類', 'GameList 列表', 'content', 'gameContent', true), descriptor('info', 'winner', '中獎資訊', 'Winner', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'Rank', 'content', 'rank'), descriptor('footer', 'team', 'Footer 資訊區', 'Team 資訊區', 'footer', 'footer')],
  clubLobby: [descriptor('topNav', 'common', '頂部導航', 'NavBar 導航入口', 'top', 'topNav', true), descriptor('notice', 'bar', '公告列', 'NoticeBar 公告列', 'content', 'notice'), descriptor('banner', 'common', 'Banner 模組', '活動 Banner 展示方式', 'content', 'banner', true), descriptor('category', 'list', '遊戲大類入口', '分類入口', 'content', 'gameEntry', true), descriptor('games', 'list', '遊戲分類', 'GameList 列表', 'content', 'gameContent', true), descriptor('info', 'winner', '中獎資訊', 'Winner', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'Rank', 'content', 'rank'), descriptor('footer', 'team', 'Footer 資訊區', 'Team／資訊區', 'footer', 'footer')],
  whiteGreenLobby: [descriptor('topNav', 'common', '頂部導航', 'Nav 入口與登入／註冊', 'top', 'topNav', true), descriptor('function', 'loginCta', '登入／註冊入口', 'Login／Register', 'content', 'loginCta'), descriptor('notice', 'bar', '公告列', 'NoticeBar', 'content', 'notice'), descriptor('banner', 'fullBleed', 'Banner 模組', '活動 Swiper', 'content', 'banner', true), descriptor('function', 'activityCards', '活動卡片', 'ActivityCards', 'content', 'activityCards'), descriptor('games', 'list', '遊戲分類', 'GameList 分類內容', 'content', 'gameContent', true), descriptor('footer', 'terms', 'Footer／條款', 'Terms', 'footer', 'footer'), descriptor('function', 'turntable', '轉盤入口', 'Turntable', 'content', 'turntable'), descriptor('function', 'pwa', 'PWA下載入口', 'DownloadPWA', 'content', 'pwa')],
  public7Lobby: [descriptor('topNav', 'common', '頂部導航', 'Nav placeholder／固定 Nav', 'top', 'topNav', true), descriptor('banner', 'fullBleed', 'Banner 模組', '活動 Swiper', 'content', 'banner', true), descriptor('notice', 'bar', '公告列', 'NoticeBar', 'content', 'notice'), descriptor('category', 'tabs', '遊戲大類入口', 'GameCategoryTabs', 'content', 'gameEntry', true), descriptor('games', 'container', '遊戲分類', 'GameSection', 'content', 'gameContent', true), descriptor('games', 'grid', '遊戲分類', 'RecommendedGames', 'content', 'recommended'), descriptor('games', 'featured', '遊戲分類', 'FeaturedGame', 'content', 'featured'), descriptor('info', 'winner', '中獎資訊', 'LuckyWinners', 'content', 'winner'), descriptor('info', 'rank', '排行資訊', 'Rank', 'content', 'rank'), descriptor('footer', 'partner', '合作夥伴', 'PartnerLogos', 'footer', 'footer'), descriptor('function', 'turntable', '轉盤入口', 'Turntable', 'content', 'turntable')],
};

function buildLayoutDescriptors(layout: LayoutCatalogItem): Descriptor[] {
  const modules = (templateDescriptors[layout.profile] || []).map((item) => ({ ...item }));
  const update = (type: ModuleType, changes: Partial<Descriptor>) => {
    const target = modules.find((item) => item.type === type && (changes.slot ? item.slot === changes.slot : true));
    if (target) Object.assign(target, changes);
  };
  const insertAfter = (slot: string, item: Descriptor) => {
    const index = modules.findIndex((entry) => entry.slot === slot);
    modules.splice(index < 0 ? modules.length : index + 1, 0, item);
  };
  const removeSlot = (slot: string) => {
    const index = modules.findIndex((entry) => entry.slot === slot);
    if (index >= 0) modules.splice(index, 1);
  };
  const appendFloating = () => {
    modules.push(descriptor('floating', 'fixedEntries', '浮標入口', '固定入口清單／依前台頁面配置展示', 'floating', 'floating'));
  };
  const bannerVariant = ({
    redHome: 'redHome', public6Home: 'ratioSwiper', blackGoldHome: 'hero', blueHome: 'fullBleed', ar004: 'ratioSwiper',
    red92Home: 'ratioSwiper', whiteGoldHome: 'hero', whiteGoldBigMumbai: 'cardCarousel', electronic: 'fullBleed', blackElectronic: 'ratioSwiper',
    red096Home: 'fullBleed', damanHome: 'daman', goGameHome: 'goGame', public3Home: 'fullBleed', okwinHome2: 'okwin',
    public5BlackGoldHome: 'hero', rajaHome: 'cardCarousel', '91club': 'cardCarousel', ar014: 'ratioSwiper',
    public5WhiteGreenHome: 'fullBleed', public7Home: 'fullBleed',
  } as Record<string, string>)[layout.home];
  const topNavVariant = topNavFormByTemplate[layout.home] || 'dualAuth';
  const topNavSourceVariant = topNavSourceFormByTemplate[layout.home] || 'topnav01';
  const topNavDefaults = topNavSettings(topNavVariant, topNavSourceVariant);
  update('topNav', {
    ...topNavDefaults,
    variant: topNavVariant,
    sourceVariant: topNavSourceVariant,
    label: topNavVariant === 'dualAuth' ? '雙入口導航' : topNavVariant === 'wideLogo' ? '寬 Logo 導航' : `頂部導航 ${topNavSourceVariant.slice(-2)}`,
    detail: `來源形式／${topNavSourceVariant.slice(-2)}／站點：${layout.sites.join('／')}`,
    referenceAsset: topNavReferenceAssetByVariant[topNavSourceVariant],
  });
  update('banner', { variant: bannerVariant || 'fullBleed' });
  const categoryVariant = ({
    redHome: 'list', public6Home: 'list', blackGoldHome: 'list', blueHome: 'blueMenu', ar004: 'blueMenu', red92Home: 'red92Menu',
    whiteGoldHome: 'containerMenu', whiteGoldBigMumbai: 'containerMenu', electronic: 'tabs', blackElectronic: 'tabs', red096Home: 'menuItem',
    damanHome: 'scene', goGameHome: 'scene', public3Home: 'tabs', okwinHome2: 'tabs', public5BlackGoldHome: 'tabs', rajaHome: 'tabs',
    '91club': 'list', ar014: 'list', public5WhiteGreenHome: 'tabs', public7Home: 'tabs',
  } as Record<string, string>)[layout.home];
  const gamesVariant = ({
    redHome: 'redHome', public6Home: 'public6', blackGoldHome: 'blackGold', blueHome: 'blueHome', ar004: 'blueHome', red92Home: 'red92',
    whiteGoldHome: 'container', whiteGoldBigMumbai: 'bigMumbai', electronic: 'electronic', blackElectronic: 'electronic', red096Home: 'electronic',
    damanHome: 'daman', goGameHome: 'goGame', public3Home: 'public3', okwinHome2: 'okwin', public5BlackGoldHome: 'public5BlackGold', rajaHome: 'raja',
    '91club': 'club91', ar014: 'ar014', public5WhiteGreenHome: 'public5WhiteGreen', public7Home: 'gameSection',
  } as Record<string, string>)[layout.home];
  update('category', { variant: categoryVariant || 'list' });
  update('games', { variant: gamesVariant || 'grid' });
  if (layout.home === 'public7Home') {
    update('games', { slot: 'recommended', variant: 'recommended' });
    update('games', { slot: 'featured', variant: 'featured' });
  }

  if (layout.home === 'redHome') {
    update('banner', { variant: 'redHome', detail: 'redHome 共用 Swiper／滿版 Banner' });
    update('games', { variant: 'redHome', label: '遊戲分類', detail: 'RedHome GameList／遊戲內容／查看全部' });
    const gameIndex = modules.findIndex((item) => item.slot === 'gameContent');
    if (gameIndex >= 0) modules.splice(gameIndex + 1, 0, descriptor('info', 'bigAward', '大獎資訊', 'RedHome BigAward（登入後／開關控制）', 'content', 'bigAward'));
  }

  if (layout.home === 'red92Home') {
    update('banner', { detail: 'red92 Swiper／比例 Banner' });
    update('notice', { detail: 'NoticeBar／跑馬燈圖標' });
    update('category', { detail: 'HomeMenu／四欄圖標入口' });
    update('games', { detail: 'HomeContainer／遊戲列表' });
    update('info', { slot: 'winner', variant: 'red92Winner', detail: 'LuckyWinners／中獎列表' });
    update('info', { slot: 'rank', variant: 'red92Rank', detail: 'DailyProfitRank／排行列表' });
  }

  // Source lobby order: NavBar -> Swiper -> NoticeBar -> game modules.
  if (layout.profile === 'clubLobby') {
    const noticeIndex = modules.findIndex((item) => item.slot === 'notice');
    const bannerIndex = modules.findIndex((item) => item.slot === 'banner');
    if (noticeIndex >= 0 && bannerIndex >= 0 && noticeIndex < bannerIndex) {
      const [notice] = modules.splice(noticeIndex, 1);
      const nextBannerIndex = modules.findIndex((item) => item.slot === 'banner');
      modules.splice(nextBannerIndex + 1, 0, notice);
    }
  }

  if (layout.home === 'rajaHome') {
    update('games', { variant: 'raja', label: '遊戲區', detail: 'Raja Game／分類遊戲卡片／查看全部' });
  }

  if (layout.home === 'public6Home') {
    const topNavIndex = modules.findIndex((item) => item.slot === 'topNav');
    modules.splice(topNavIndex < 0 ? 0 : topNavIndex, 0, descriptor('screenBanner', 'public6DownloadBar', '畫面頂部下載橫幅', '品牌圖標／下載文案／安裝／關閉', 'top', 'screenBanner', false, 'screenBanner'));
    insertAfter('notice', descriptor('info', 'person', '個人資訊列', 'PersonCenterInfoBar', 'content', 'personInfo'));
    removeSlot('footer');
  }
  if (layout.home === 'blackGoldHome') {
    insertAfter('notice', descriptor('info', 'person', '個人／登入狀態資訊', '會員資訊列／登入狀態', 'content', 'personInfo'));
    removeSlot('footer');
  }
  if (layout.home === 'whiteGoldHome' || layout.home === 'whiteGoldBigMumbai') {
    insertAfter('topNav', descriptor('function', 'loginTip', '登入提示', 'LoginTip（未登入狀態）', 'content', 'loginTip'));
    removeSlot('footer');
  }
  // DownloadPWA and Turntable are global floating entries in the source product,
  // not content cards inside the homepage flow.
  if (layout.home === 'public5WhiteGreenHome') {
    removeSlot('turntable');
    removeSlot('pwa');
  }
  if (layout.home === 'public7Home') removeSlot('turntable');
  if (layout.home === 'whiteGoldBigMumbai') update('games', { detail: 'WhiteGoldHome GameContainer／BigMumbai' });
  if (layout.home === 'electronic' || layout.home === 'red096Home') removeSlot('footer');
  if (layout.home === 'blackElectronic') {
    update('footer', { variant: 'legal', label: 'Footer／品牌資訊', detail: 'BottomLogoText' });
    const gameIndex = modules.findIndex((item) => item.slot === 'gameContent');
    if (gameIndex >= 0) modules.splice(gameIndex + 1, 0, descriptor('info', 'bigAward', '大獎資訊', 'BigAward（條件展示）', 'content', 'bigAward'));
  }
  if (layout.home === 'red096Home') {
    update('category', { variant: 'menuItem', detail: 'MenuItem 分類入口' });
  }
  if (layout.home === 'damanHome') {
    insertAfter('footer', descriptor('function', 'settingsPanel', '設定入口', 'SettingPanel／偏好與客服入口', 'content', 'settingsPanel'));
  }
  if (layout.home === 'goGameHome') {
    insertAfter('footer', descriptor('function', 'settingsPanel', '設定入口', 'SettingPanel／偏好與客服入口', 'content', 'settingsPanel'));
  }
  if (layout.home === 'okwinHome2') {
    const noticeIndex = modules.findIndex((item) => item.slot === 'notice');
    modules.splice(noticeIndex + 1, 0, descriptor('function', 'walletActions', '快捷／錢包入口', 'Okwin Turntable／VIP／WalletActions', 'content', 'walletActions'));
  }
  if (layout.home === 'public3Home') {
    insertAfter('topNav', descriptor('function', 'sideNav', 'PC 側邊導航', '固定入口／搜尋與分類導航', 'content', 'sideNav'));
    insertAfter('notice', descriptor('function', 'quickActions', '首頁快捷卡', '首頁快捷入口組合', 'content', 'quickActions'));
    insertAfter('rank', descriptor('info', 'bigAward', '大獎資訊', 'BigAward（條件展示）', 'content', 'bigAward'));
    const gameIndex = modules.findIndex((item) => item.slot === 'gameContent');
    const bigAwardIndex = modules.findIndex((item) => item.slot === 'bigAward');
    if (gameIndex >= 0 && bigAwardIndex >= 0 && gameIndex < bigAwardIndex) {
      const [game] = modules.splice(gameIndex, 1);
      const nextBigAwardIndex = modules.findIndex((item) => item.slot === 'bigAward');
      modules.splice(nextBigAwardIndex + 1, 0, game);
    }
  }
  if (layout.home === 'public5BlackGoldHome') {
    const winnerIndex = modules.findIndex((item) => item.slot === 'winner');
    const gameIndex = modules.findIndex((item) => item.slot === 'gameContent');
    if (winnerIndex >= 0 && gameIndex >= 0 && winnerIndex > gameIndex) {
      const [winner] = modules.splice(winnerIndex, 1);
      modules.splice(gameIndex, 0, winner);
    }
  }
  if (layout.home === 'rajaHome') {
    const noticeIndex = modules.findIndex((item) => item.slot === 'notice');
    const bannerIndex = modules.findIndex((item) => item.slot === 'banner');
    if (noticeIndex >= 0 && bannerIndex >= 0 && noticeIndex > bannerIndex) {
      const [notice] = modules.splice(noticeIndex, 1);
      modules.splice(bannerIndex, 0, notice);
    }
    const gameIndex = modules.findIndex((item) => item.slot === 'gameContent');
    modules.splice(gameIndex + 1, 0, descriptor('info', 'bigAward', '大獎資訊', 'BigAward／Customer', 'content', 'bigAward'));
  }
  if (layout.home === '91club' || layout.home === 'ar014') {
    insertAfter('banner', descriptor('function', 'quickActions', '品牌快捷入口', '客服／充值／提款／VIP', 'content', 'quickActions'));
  }
  if (layout.home === 'ar014') removeSlot('footer');
  modules.forEach((item) => {
    if (item.type === 'category') {
      item.label = '遊戲大類入口';
      const detail = item.detail.replace(/^(遊戲大類入口|遊戲內容區|遊戲分類|原頁切換)[／/ ]*/, '');
      item.detail = `原頁切換${detail ? `／${detail}` : ''}`;
      item.interaction = 'switch';
    }
    if (item.type === 'games') {
      item.label = '遊戲分類';
      const detail = item.detail.replace(/^(遊戲大類入口|遊戲內容區|遊戲分類|跳二級頁)[／/ ]*/, '');
      item.detail = `跳二級頁${detail ? `／${detail}` : ''}`;
      item.interaction = 'secondaryPage';
    }
  });
  appendFloating();
  return modules;
}

layoutCatalog.forEach((layout) => {
  templateDescriptors[layout.home] = buildLayoutDescriptors(layout);
});

function descriptorsForPlatform(templateId: string, platform: Platform): Descriptor[] {
  const descriptors = templateDescriptors[templateId] || [];
  return platform === 'desktop'
    ? descriptors
    : descriptors.filter((item) => item.variant !== 'sideNav');
}

const topNavFormLibrary: LibraryItem[] = [
  { type: 'topNav', variant: 'dualAuth', label: '雙入口導航', note: 'Logo／登入／註冊；主按鈕可切換', symbol: 'N', zone: 'top', category: 'topNav', compatibility: 'ready', referenceAsset: topNav01Source, sourceVariant: 'topnav01' },
  { type: 'topNav', variant: 'wideLogo', label: '寬 Logo 導航', note: '寬 Logo／右側圖標；可加登入註冊列', symbol: 'N', zone: 'top', category: 'topNav', compatibility: 'ready', referenceAsset: topNav03Source, sourceVariant: 'topnav03' },
  { type: 'topNav', variant: 'topnav05', label: '頂部導航 05', note: '來源框架／Topnav 5／375×100', symbol: 'N', zone: 'top', category: 'topNav', compatibility: 'ready', referenceAsset: topNav05Source },
  { type: 'topNav', variant: 'topnav06', label: '頂部導航 06', note: '來源框架／Topnav 6／375×44', symbol: 'N', zone: 'top', category: 'topNav', compatibility: 'ready', referenceAsset: topNav06Source },
  { type: 'topNav', variant: 'topnav07', label: '頂部導航 07', note: '來源框架／Topnav 7／400×78', symbol: 'N', zone: 'top', category: 'topNav', compatibility: 'ready', referenceAsset: topNav07Source },
];

const library: LibraryItem[] = [
  ...topNavFormLibrary,
  { type: 'screenBanner', variant: 'public6DownloadBar', label: '畫面頂部下載橫幅', note: 'AR092／品牌圖標／下載文案／安裝／關閉', symbol: 'H', zone: 'top', category: 'screenBanner', compatibility: 'ready' },
  ...bottomNavCatalog.map((item) => ({ type: 'bottomNav' as ModuleType, variant: item.variant, label: `底部導航／${item.label}`, note: item.note, symbol: 'D', zone: 'bottom' as Zone, category: 'bottomNav' as ModuleCategory, compatibility: 'ready' as const })),
  { type: 'banner', variant: 'fullBleed', label: '共用滿版輪播', note: '共用 Swiper／滿版 Hero／指示點', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'redHome', label: 'redHome 滿版輪播', note: '共用 Swiper／單張滿版圖片／圓角', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'ratioSwiper', label: '比例輪播', note: '依版面比例等比縮放的 Swiper', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'hero', label: '主視覺 Hero', note: 'Banner 圖片＋活動資訊並置', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'cardCarousel', label: '卡片式輪播', note: '多卡片／可橫向滑動展示', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'okwin', label: 'Okwin 專用輪播', note: 'Okwin Header／Swiper 版式', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'goGame', label: 'GO Game 專用輪播', note: 'GO Game Swiper／場景入口', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'banner', variant: 'daman', label: 'Daman 專用輪播', note: 'Daman Swiper／場景入口', symbol: 'B', zone: 'content', compatibility: 'ready' },
  { type: 'notice', variant: 'common', label: '公告提示', note: '模板專用公告提示容器', symbol: 'A', zone: 'content', compatibility: 'ready' },
  { type: 'notice', variant: 'bar', label: '公告列', note: 'NoticeBar 細列／消息輪播', symbol: 'A', zone: 'content', compatibility: 'ready' },
  { type: 'notice', variant: 'daman', label: 'Daman 公告提示', note: 'NoticeDaman 圓角公告容器', symbol: 'A', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'list', label: '分類入口', note: '原頁切換', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'menuItem', label: 'MenuItem 圖標入口', note: '原頁切換／圖標網格', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'tabs', label: '分類頁籤', note: '原頁切換／頁籤', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'blueMenu', label: 'BlueHome GameMenu', note: '原頁切換／八個入口', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'containerMenu', label: 'Home／GameMenu', note: '原頁切換／圖標入口', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'scene', label: '場景分類', note: '原頁切換／場景入口', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'category', variant: 'red92Menu', label: 'red92 HomeMenu', note: '原頁切換／四欄圖標', symbol: 'C', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'redHome', label: 'redHome GameList', note: '跳二級頁／遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'public6', label: 'Public6Home GameList', note: '跳二級頁／遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'blueHome', label: 'BlueHome GamesList', note: '跳二級頁／遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'blackGold', label: 'BlackGold Game', note: '遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'public3', label: 'Public3 gameList', note: '分類內容列表', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'okwin', label: 'Okwin2 gameList', note: '分類內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'public5BlackGold', label: 'Public5BlackGold gameList', note: '遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'public5WhiteGreen', label: 'Public5WhiteGreen GameList', note: '白綠版遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'club91', label: '91club gameList', note: '遊戲卡片', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'ar014', label: 'ar014 gameList', note: '遊戲卡片', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'raja', label: 'Raja gameList', note: '分類遊戲卡片／中獎率／查看全部', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'red92', label: 'red92 HomeContainer', note: '遊戲列表／無外包容器', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'daman', label: 'Daman GameScenes', note: '分段遊戲內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'goGame', label: 'GO Game GameScenes', note: '遊戲分段', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'gameSection', label: 'Public7 GameSection', note: '分段內容', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'recommended', label: 'Public7 RecommendedGames', note: 'AR093／推薦遊戲內容區', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'container', label: '遊戲容器', note: '模板專用容器形式', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'bigMumbai', label: 'BigMumbai GameContainer', note: '白金版遊戲容器', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'scene', label: '場景遊戲區', note: '專用場景 renderer', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'electronic', label: '電子分段遊戲區', note: 'AloneGame／Slot／Video 分段', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'games', variant: 'featured', label: '特色遊戲區', note: 'Recommended／Featured 內容區', symbol: 'G', zone: 'content', compatibility: 'ready' },
  { type: 'info', variant: 'winner', label: '中獎資訊', note: 'LuckyWinners／Winner', symbol: 'W', zone: 'content', category: 'winner', compatibility: 'ready' },
  { type: 'info', variant: 'red92Winner', label: 'red92 中獎資訊', note: '頭像／遊戲圖／中獎金額列表', symbol: 'W', zone: 'content', category: 'winner', compatibility: 'ready' },
  { type: 'info', variant: 'bigAward', label: 'Super Jackpot', note: 'BigAward／大獎入口', symbol: 'J', zone: 'content', category: 'jackpot', compatibility: 'ready' },
  { type: 'info', variant: 'person', label: '個人／登入狀態資訊', note: 'PersonCenterInfoBar／Login 狀態', symbol: 'I', zone: 'content', compatibility: 'ready' },
  { type: 'info', variant: 'winning', label: 'Winning／Profit', note: '電子遊戲中獎與收益資訊', symbol: 'I', zone: 'content', compatibility: 'ready' },
  { type: 'info', variant: 'instructions', label: '說明資訊', note: 'Instructions／Slot／Video', symbol: 'I', zone: 'content', compatibility: 'ready' },
  { type: 'info', variant: 'rank', label: '排行榜', note: 'DailyProfitRank／Rank', symbol: 'R', zone: 'content', category: 'rank', compatibility: 'ready' },
  { type: 'info', variant: 'red92Rank', label: 'red92 排行資訊', note: '前三名台座／其餘排行列表', symbol: 'R', zone: 'content', category: 'rank', compatibility: 'ready' },
  { type: 'footer', variant: 'legal', label: '品牌資訊', note: 'BottomLogoText 形式', symbol: 'F', zone: 'footer', compatibility: 'ready' },
  { type: 'footer', variant: 'team', label: 'Team 資訊區', note: '工具／客服／供應商入口', symbol: 'F', zone: 'footer', compatibility: 'ready' },
  { type: 'footer', variant: 'terms', label: '條款資訊區', note: 'Terms 形式', symbol: 'F', zone: 'footer', compatibility: 'ready' },
  { type: 'footer', variant: 'partner', label: '合作夥伴', note: 'PartnerLogos／合作夥伴圖標', symbol: 'F', zone: 'footer', compatibility: 'ready' },
  { type: 'footer', variant: 'info', label: '模板資訊區', note: '電子版面 Footer／資訊組合', symbol: 'F', zone: 'footer', compatibility: 'ready' },
  { type: 'function', variant: 'loginCta', label: '登入／註冊入口', note: 'Login／Register 固定路由', symbol: 'F', zone: 'content', compatibility: 'ready' },
  { type: 'function', variant: 'loginTip', label: '登入提示', note: 'LoginTip／未登入狀態', symbol: 'F', zone: 'content', compatibility: 'ready' },
  { type: 'function', variant: 'activityCards', label: '二級 Banner', note: 'ActivityCards／活動入口', symbol: 'B', zone: 'content', category: 'secondaryBanner', compatibility: 'ready' },
  { type: 'function', variant: 'walletActions', label: '錢包', note: 'WalletActions／充值／提款／VIP', symbol: 'W', zone: 'content', category: 'wallet', compatibility: 'ready' },
  { type: 'function', variant: 'quickActions', label: '品牌快捷入口', note: '客服／充值／提款／VIP', symbol: 'Q', zone: 'content', compatibility: 'ready' },
  { type: 'function', variant: 'sideNav', label: 'PC 側邊導航', note: '固定入口／搜尋與分類導航', symbol: 'S', zone: 'content', compatibility: 'ready' },
  { type: 'function', variant: 'settingsPanel', label: '設定入口', note: 'SettingPanel／偏好與客服入口', symbol: 'S', zone: 'content', compatibility: 'ready' },
  { type: 'function', variant: 'social', label: '社媒入口', note: 'Telegram／社群／外部連結', symbol: 'S', zone: 'content', category: 'social', compatibility: 'ready' },
  { type: 'function', variant: 'customDisplay', label: '自訂展示', note: '2×3圖片格／列數、欄數與圖片可調', symbol: 'C', zone: 'content', category: 'custom', compatibility: 'ready' },
  { type: 'function', variant: 'turntable', label: '轉盤入口', note: 'Turntable／固定路由', symbol: 'T', zone: 'content', category: 'floating', compatibility: 'ready' },
  { type: 'function', variant: 'pwa', label: 'PWA下載入口', note: 'DownloadPWA／下載入口', symbol: 'D', zone: 'content', category: 'floating', compatibility: 'ready' },
  { type: 'floating', variant: 'fixedEntries', label: '浮標入口', note: '固定入口清單／依前台頁面配置展示', symbol: '浮', zone: 'floating', compatibility: 'ready' },
];

library.forEach((item) => {
  if (item.type === 'category') {
    item.interaction = 'switch';
    item.label = `遊戲大類入口／${item.label}`;
    item.note = `${item.note}／原頁切換`;
  }
  if (item.type === 'games') {
    item.interaction = 'secondaryPage';
    item.label = `遊戲分類／${item.label}`;
    item.note = `${item.note}／跳二級頁`;
  }
});

const activePlatform = ref<Platform>(requestedPlatform === 'mobile' || requestedPlatform === 'app' ? requestedPlatform : 'desktop');
const copySource = ref<Platform>('mobile');
const selectedModuleId = ref('');
const libraryCategory = ref<ModuleCategory | null>(null);
const processStep = ref(1);
const inspectorTab = ref<'library' | 'pageLayout' | 'settings'>('pageLayout');
const sharedStatus = sharedStored?.status;
const statusByPlatform = reactive<Record<Platform, Status>>({
  desktop: isSharedEditFlow && requestedPlatform === 'desktop' ? (sharedStatus || '草稿') : (storedDraft?.statusByPlatform?.desktop || '草稿'),
  mobile: isSharedEditFlow && requestedPlatform === 'mobile' ? (sharedStatus || '草稿') : (storedDraft?.statusByPlatform?.mobile || '草稿'),
  app: isSharedEditFlow && requestedPlatform === 'app' ? (sharedStatus || '草稿') : (storedDraft?.statusByPlatform?.app || '草稿'),
});
const versions = reactive<Record<Platform, number>>({
  desktop: isSharedEditFlow && requestedPlatform === 'desktop' ? (sharedStored?.version || 1) : (storedDraft?.versions?.desktop || 3),
  mobile: isSharedEditFlow && requestedPlatform === 'mobile' ? (sharedStored?.version || 1) : (storedDraft?.versions?.mobile || 2),
  app: isSharedEditFlow && requestedPlatform === 'app' ? (sharedStored?.version || 1) : (storedDraft?.versions?.app || 1),
});
const versionHistoryByPlatform = reactive<Record<Platform, VersionRecord[]>>({
  desktop: [],
  mobile: [],
  app: [],
});
const preserveVersionOnSave = reactive<Record<Platform, boolean>>({
  desktop: false,
  mobile: false,
  app: false,
});
const previewed = reactive<Record<Platform, boolean>>({
  desktop: isSharedEditFlow && requestedPlatform === 'desktop' ? Boolean(sharedStored?.previewed) : Boolean(storedDraft?.previewed?.desktop),
  mobile: isSharedEditFlow && requestedPlatform === 'mobile' ? Boolean(sharedStored?.previewed) : Boolean(storedDraft?.previewed?.mobile),
  app: isSharedEditFlow && requestedPlatform === 'app' ? Boolean(sharedStored?.previewed) : Boolean(storedDraft?.previewed?.app),
});
// 每個設備端獨立追蹤未保存狀態；新建時只有實際修改的設備端才會變更為未保存。
const dirtyByPlatform = reactive<Record<Platform, boolean>>({ desktop: false, mobile: false, app: false });
const dirty = computed({
  get: () => dirtyByPlatform[activePlatform.value],
  set: (value: boolean) => { dirtyByPlatform[activePlatform.value] = value; },
});
const lastModifiedByPlatform = reactive<Record<Platform, string>>({
  desktop: isSharedEditFlow && requestedPlatform === 'desktop' ? (sharedStored?.lastModifiedAt || '尚未保存') : (storedDraft?.lastModifiedByPlatform?.desktop || '尚未保存'),
  mobile: isSharedEditFlow && requestedPlatform === 'mobile' ? (sharedStored?.lastModifiedAt || '尚未保存') : (storedDraft?.lastModifiedByPlatform?.mobile || '尚未保存'),
  app: isSharedEditFlow && requestedPlatform === 'app' ? (sharedStored?.lastModifiedAt || '尚未保存') : (storedDraft?.lastModifiedByPlatform?.app || '尚未保存'),
});
const previewVisible = ref(false);
const previewPlatform = ref<Platform>('desktop');
const iconLibraryVisible = ref(false);
const iconLibraryTarget = ref('');
const versionsVisible = ref(false);
const rejectModalVisible = ref(false);
const rejectReason = ref('');
const scheduleModalVisible = ref(false);
const scheduleAt = ref('');
const copyDialogVisible = ref(false);
const pendingCopyModules = ref<ModuleConfig[]>([]);
const copyConflicts = reactive<CopyConflict[]>([]);
const gamePickerVisible = ref(false);
const gamePickerVenueId = ref('');
const gamePickerSubcategoryId = ref('');
const gamePickerMainCategoryIds = ref<string[]>([]);
const gamePickerProviderIds = ref<string[]>([]);
const gamePickerGameIds = ref<string[]>([]);
const gamePickerSearch = ref('');
let idSeed = 0;

const nextId = () => `module-${++idSeed}`;
function defaultGameSubcategory(id: string, name: string, mainCategoryIds: string[], providerIds: string[]): GameSubcategoryConfig {
  return {
    id,
    name,
    mainCategoryIds,
    providerIds,
    gameIds: gameCatalog
      .filter((game) => game.mainCategoryIds.some((categoryId) => mainCategoryIds.includes(categoryId)) && providerIds.includes(game.providerId))
      .slice(0, 6)
      .map((game) => game.id),
    displayMode: 'iconText',
    iconVisible: true,
    iconKey: 'games-outline',
    iconName: '',
    iconSource: '',
  };
}
function createDefaultGameVenues(scopeId: string): GameVenueConfig[] {
  return [{
    id: `${scopeId}-venue-casino`,
    name: 'Casino',
    subcategories: [
      defaultGameSubcategory(`${scopeId}-sub-slots`, '電子', ['slots'], ['pg', 'jdb']),
      defaultGameSubcategory(`${scopeId}-sub-live`, '真人', ['live'], ['evolution', 'sexy']),
    ],
  }];
}
function ensurePageGameVenueConfig(pageLayout: PageLayoutConfig) {
  if (!pageLayout.gameVenues?.length) {
    pageLayout.gameVenues = createDefaultGameVenues('page');
  }
  pageLayout.gameVenues.forEach((venue) => {
    venue.subcategories ||= [];
    venue.subcategories.forEach((subcategory) => {
      subcategory.displayMode = subcategory.displayMode || 'iconText';
      subcategory.iconVisible = subcategory.iconVisible !== false;
      subcategory.iconKey = subcategory.iconKey || 'games-outline';
      subcategory.iconName = subcategory.iconName || '';
      subcategory.iconSource = subcategory.iconSource || '';
    });
  });
}
function ensureGameDisplayConfig(module: ModuleConfig) {
  if (module.type !== 'games') return;
  module.gameVenues = [];
}
function ensureCustomDisplayConfig(module: ModuleConfig) {
  const rows = Math.max(1, Math.min(6, module.customDisplayRows || 2));
  const columns = Math.max(1, Math.min(6, module.customDisplayColumns || 3));
  const current = module.customDisplaySlots || [];
  module.customDisplayRows = rows;
  module.customDisplayColumns = columns;
  module.customDisplaySlots = Array.from({ length: rows * columns }, (_, index) => current[index] || ({ id: `custom-slot-${index + 1}`, imageName: '', imageSource: '' }));
}
function createModule(item: Descriptor, sourceTemplateId = ''): ModuleConfig {
  const module: ModuleConfig = {
    ...item,
    id: nextId(),
    ratio: item.type === 'banner' ? '351:160' : '',
    sourceTemplateId,
    isCustomModule: false,
  };
  if (item.type === 'banner') {
    module.bannerCount = 1;
    module.bannerAlign = 'center';
  }
  if (item.type === 'topNav') {
    applyTopNavSettings(module, item.variant, item.sourceVariant);
    module.logoName = '尚未上傳 LOGO';
    module.logoSource = '';
    module.buttonKeys = ['notification', 'download'];
    module.buttonIconNames = {};
    module.buttonIconSources = {};
    module.buttonIconKeys = { notification: 'notification', download: 'download' };
    if (item.variant === 'raja') {
      module.buttonKeys = ['notification', 'customerService'];
      module.buttonIconKeys = { notification: 'notification', customerService: 'customerService' };
    }
    if (item.variant === 'okwin') {
      module.buttonKeys = ['download', 'language'];
      module.buttonIconKeys = { download: 'download', language: 'language' };
    }
    if (item.variant === 'blackGold') {
      module.buttonKeys = ['download', 'customerService', 'language'];
      module.buttonIconKeys = { download: 'download', customerService: 'customerService', language: 'language' };
    }
    if (item.variant === 'daman') {
      module.buttonKeys = ['notification'];
      module.buttonIconKeys = { notification: 'notification' };
    }
    if (item.variant === 'goGame') {
      module.buttonKeys = [];
      module.buttonIconKeys = {};
    }
    if (item.variant === 'public5WhiteGreen') {
      module.buttonKeys = ['notification', 'download'];
      module.buttonIconKeys = { notification: 'notification', download: 'download' };
    }
    if (item.variant === 'public7') {
      module.buttonKeys = ['wallet', 'download', 'language'];
      module.buttonIconKeys = { wallet: 'wallet', download: 'download', language: 'language' };
    }
    if (item.variant === 'electronicNav' || item.variant === 'red096') {
      module.buttonKeys = ['download', 'customerService'];
      module.buttonIconKeys = { download: 'download', customerService: 'customerService' };
    }
    if (item.variant === 'public5BlackGold' || item.variant === 'club') {
      module.buttonKeys = ['download'];
      module.buttonIconKeys = { download: 'download' };
    }
  }
  if (item.type === 'notice') {
    module.noticeIconKey = 'notice';
    module.noticeIconName = '';
    module.noticeIconSource = '';
  }
  if (item.type === 'category') {
    module.entryDisplayMode = 'iconText';
    module.iconVisible = true;
  }
  if (item.type === 'bottomNav') ensureBottomNavConfig(module);
  if (item.type === 'floating') {
    module.floatingEdge = 'right';
    module.floatingOffset = 420;
    module.floatingPageKeys = [...allFloatingPageKeys];
    module.floatingIconFunction = 'rewardCenter';
    module.floatingIconKey = 'rewardCenter';
    module.floatingIconName = '';
    module.floatingIconSource = '';
  }
  if (item.type === 'games') {
    module.rtpEnabled = false;
    ensureGameDisplayConfig(module);
  }
  if (item.variant === 'customDisplay') ensureCustomDisplayConfig(module);
  return module;
}
function ensureBottomNavConfig(module: ModuleConfig) {
  if (module.type !== 'bottomNav') return;
  const keys = bottomNavEntryKeysByVariant[module.variant] || bottomNavEntryCatalog.map((item) => item.key);
  const existing = module.bottomNavItems || [];
  module.bottomNavItems = keys.map((key) => {
    const definition = bottomNavEntryCatalog.find((item) => item.key === key) || bottomNavEntryCatalog[0];
    const current = existing.find((item) => item.key === key);
    return {
      key,
      label: definition.label,
      route: definition.route,
      activeIconKey: current?.activeIconKey || `${key}-filled`,
      inactiveIconKey: current?.inactiveIconKey || `${key}-outline`,
      activeIconName: current?.activeIconName || '',
      inactiveIconName: current?.inactiveIconName || '',
      activeIconSource: current?.activeIconSource || '',
      inactiveIconSource: current?.inactiveIconSource || '',
    };
  });
}
function createPageLayoutConfig(): PageLayoutConfig {
  return { outerWidth: 1920, sideNavEnabled: false, bottomNavEnabled: null, columns: 1, contentWidth: 1920, columnRatio: '1', columnGap: 20, themeId: '', authState: 'loggedOut', gameVenues: createDefaultGameVenues('page') };
}
function defaultThemeForTemplate(templateId: string) {
  if (templateId === 'red92Home') return 'red92Style';
  const layout = layoutCatalog.find((item) => item.home === templateId);
  if (!layout) return themeCatalog[0]?.id || 'redStyle';
  const siteKeys = new Set(layout.sites.map((site) => site.toLowerCase()));
  const matches = themeCatalog.filter((theme) => theme.sites.some((site) => siteKeys.has(site.toLowerCase())));
  const uniqueThemeIds = [...new Set(matches.map((theme) => theme.id))];
  return uniqueThemeIds[0] || themeCatalog[0]?.id || 'redStyle';
}
function createConfig(templateId: string, platform: Platform): HomeConfig {
  const modules = templateId && templateDescriptors[templateId] ? descriptorsForPlatform(templateId, platform).map((item) => createModule(item, templateId)) : [];
  const topNav = modules.find((module) => module.type === 'topNav');
  if (topNav && templateId === 'public7Home') {
    topNav.buttonKeys = ['wallet', 'download', 'language'];
    topNav.buttonIconKeys = { wallet: 'wallet', download: 'download', language: 'language' };
  }
  const pageLayout = createPageLayoutConfig();
  pageLayout.themeId = templateId ? defaultThemeForTemplate(templateId) : '';
  pageLayout.sideNavEnabled = modules.some((module) => module.variant === 'sideNav');
  ensurePageGameVenueConfig(pageLayout);
  return { templateId, isCustomTemplate: false, pageLayout, modules };
}

function sourcePublishedConfig(platform: Platform) {
  return sourcePublishedConfigFromDraft(sourceDraft, platform);
}

function sourcePublishedConfigFromDraft(draft: StoredDraftSnapshot | null, platform: Platform) {
  const history = draft?.versionHistoryByPlatform?.[platform] || [];
  const latestPublished = history
    .filter((record) => record.status === '已發布' && record.config)
    .sort((a, b) => b.version - a.version)[0];
  return latestPublished?.config || draft?.configs?.[platform];
}

function initialConfig(platform: Platform) {
  if (platform === 'desktop') return createConfig('', platform);
  if (isSharedEditFlow && requestedPlatform === platform) {
    const sharedConfig = sharedStored?.config;
    return sharedConfig
      ? cloneHomeConfig(sharedConfig)
      : createConfig(sharedTemplateId || publishedTemplateByMerchant[tenantId]?.[platform] || '', platform);
  }
  const isRequestedApplyPlatform = isApplyFlow && requestedPlatform === platform;
  const isBatchTarget = Boolean(batchHandoff?.platforms.includes(platform));
  if (isBatchTarget && batchHandoff?.mode === 'new') return createConfig('', platform);
  if (isBatchTarget && batchHandoff?.mode === 'apply') {
    const sourceConfig = sourcePublishedConfigFromDraft(batchSourceDraft, platform);
    const sourceTemplate = batchHandoff.sourceTemplateByPlatform?.[platform] || '';
    return sourceConfig ? cloneHomeConfig(sourceConfig) : createConfig(sourceTemplate, platform);
  }
  const sourceSharedLayoutId = isRequestedApplyPlatform
    ? getMerchantSeed(applySourceMerchantId)?.sharedLayoutByPlatform[platform]
    : '';
  const sourceSharedConfig = sourceSharedLayoutId
    ? readStoredSharedLayout<SharedLayoutStoredSnapshot>(sourceSharedLayoutId, platform)
    : null;
  const sourceConfig = isRequestedApplyPlatform
    ? sourcePublishedConfig(platform) || (sourceSharedConfig?.status === '已發布' ? sourceSharedConfig.config : undefined)
    : undefined;
  const targetSharedLayoutId = getMerchantSeed(tenantId)?.sharedLayoutByPlatform[platform] || '';
  const targetSharedConfig = targetSharedLayoutId
    ? readStoredSharedLayout<SharedLayoutStoredSnapshot>(targetSharedLayoutId, platform)
    : null;
  const publishedTemplate = publishedTemplateByMerchant[tenantId]?.[platform] || '';
  return sourceConfig
    ? cloneHomeConfig(sourceConfig)
    : targetSharedConfig?.status === '已發布'
      ? cloneHomeConfig(targetSharedConfig.config)
      : createConfig(isNewFlow ? '' : publishedTemplate, platform);
}

const configs = reactive<Record<Platform, HomeConfig>>({
  desktop: initialConfig('desktop'),
  mobile: initialConfig('mobile'),
  app: initialConfig('app'),
});

function cloneHomeConfig(config: HomeConfig): HomeConfig {
  return JSON.parse(JSON.stringify(config)) as HomeConfig;
}

const moduleZoneOrder: Record<Zone, number> = {
  top: 0,
  content: 1,
  footer: 2,
  bottom: 3,
  floating: 4,
};
function sortModulesByZone(modules: ModuleConfig[]) {
  modules
    .map((module, index) => ({ module, index }))
    .sort((a, b) => moduleZoneOrder[a.module.zone] - moduleZoneOrder[b.module.zone] || a.index - b.index)
    .forEach((entry, index) => {
      modules[index] = entry.module;
    });
}

function normalizeStoredConfig(config: HomeConfig, platform: Platform) {
  if (platform === 'desktop') {
    config.templateId = '';
    config.isCustomTemplate = false;
    config.modules = [];
    config.pageLayout = createPageLayoutConfig();
    return;
  }
  const storedModuleGameVenues = config.modules.find((module) => module.type === 'games' && module.gameVenues?.length)?.gameVenues;
  config.pageLayout = { ...createPageLayoutConfig(), ...config.pageLayout };
  if (!config.pageLayout.gameVenues?.length && storedModuleGameVenues?.length) {
    config.pageLayout.gameVenues = JSON.parse(JSON.stringify(storedModuleGameVenues)) as GameVenueConfig[];
  }
  ensurePageGameVenueConfig(config.pageLayout);
  config.pageLayout.authState = config.pageLayout.authState === 'loggedIn' ? 'loggedIn' : 'loggedOut';
  config.pageLayout.themeId = config.pageLayout.themeId || defaultThemeForTemplate(config.templateId);
  config.pageLayout.bottomNavEnabled = true;
  const sourceDescriptors = templateDescriptors[config.templateId] || [];
  const sourceKeys = new Set(sourceDescriptors.map((item) => `${item.type}:${item.slot}`));
  const storedModules = config.modules.map((module) => ({
    ...module,
    sourceTemplateId: module.sourceTemplateId || config.templateId,
    isCustomModule: typeof module.isCustomModule === 'boolean'
      ? module.isCustomModule
      : !sourceKeys.has(`${module.type}:${module.slot}`),
  }));
  const usedStoredIds = new Set<string>();
  const normalizedSourceModules = sourceDescriptors.map((source) => {
    const existing = storedModules.find((module) => !usedStoredIds.has(module.id) && module.type === source.type && module.slot === source.slot);
    if (!existing) return createModule(source, config.templateId);
    usedStoredIds.add(existing.id);
    if (existing.isCustomModule) return existing;

    // Source modules follow the selected template. Keep saved runtime fields,
    // but always replace the structural identity so stale saved configs cannot
    // render another template's module shape.
    return {
      ...createModule(source, config.templateId),
      ...existing,
      ...source,
      id: existing.id,
      sourceTemplateId: existing.sourceTemplateId || config.templateId,
      isCustomModule: false,
    };
  });
  const preservedCustomModules = storedModules.filter((module) => !usedStoredIds.has(module.id) && module.isCustomModule);
  config.modules = [...normalizedSourceModules, ...preservedCustomModules];
  sortModulesByZone(config.modules);
  if (config.pageLayout.bottomNavEnabled === true && !config.modules.some((module) => module.type === 'bottomNav')) {
    insertModuleIntoList(config.modules, createModule(bottomNavDescriptor(config.templateId), config.templateId));
  }
  config.modules = config.modules.filter((module) => module.variant !== 'sideNav');
  config.pageLayout.sideNavEnabled = false;
  config.modules.forEach((module) => {
    if (module.type === 'games') ensureGameDisplayConfig(module);
    if (module.type === 'category') {
      module.entryDisplayMode = module.entryDisplayMode || 'iconText';
      module.iconVisible = module.iconVisible !== false;
    }
  });
}

platformKeys.forEach((platform) => {
  const storedConfig = storedDraft?.configs?.[platform];
  if (storedConfig && typeof storedConfig.templateId === 'string' && Array.isArray(storedConfig.modules)) {
    configs[platform] = cloneHomeConfig(storedConfig);
    normalizeStoredConfig(configs[platform], platform);
  }
});

const savedConfigs = reactive<Record<Platform, HomeConfig>>({
  desktop: cloneHomeConfig(configs.desktop),
  mobile: cloneHomeConfig(configs.mobile),
  app: cloneHomeConfig(configs.app),
});
const savedPreviewed = reactive<Record<Platform, boolean>>({
  desktop: Boolean(storedDraft?.previewed?.desktop),
  mobile: Boolean(storedDraft?.previewed?.mobile),
  app: Boolean(storedDraft?.previewed?.app),
});
const savedStatusByPlatform = reactive<Record<Platform, Status>>({
  desktop: statusByPlatform.desktop,
  mobile: statusByPlatform.mobile,
  app: statusByPlatform.app,
});

function snapshotSavedPlatform(platform: Platform) {
  savedConfigs[platform] = cloneHomeConfig(configs[platform]);
  savedPreviewed[platform] = previewed[platform];
  savedStatusByPlatform[platform] = statusByPlatform[platform];
}

function nowText() {
  return new Date().toLocaleString('zh-TW', { hour12: false });
}

function createVersionRecord(platform: Platform, version = versions[platform], status = statusByPlatform[platform], lastModifiedAt = lastModifiedByPlatform[platform]): VersionRecord {
  return {
    version,
    status,
    lastModifiedAt,
    editedBy: '原型使用者',
    modifiedBy: '原型使用者',
    scheduleHistory: [],
    retryCount: 0,
    retryHistory: [],
    config: cloneHomeConfig(configs[platform]),
  };
}

platformKeys.forEach((platform) => {
  const storedHistory = isSharedEditFlow && requestedPlatform === platform
    ? sharedStored?.versionHistory
    : storedDraft?.versionHistoryByPlatform?.[platform];
  versionHistoryByPlatform[platform] = storedHistory?.length
    ? storedHistory.map((record) => ({
        ...record,
        scheduleHistory: [...(record.scheduleHistory || [])],
        retryCount: record.retryCount || 0,
        retryHistory: [...(record.retryHistory || [])],
        systemReportRecipients: record.systemReportRecipients ? [...record.systemReportRecipients] : undefined,
        config: record.config ? cloneHomeConfig(record.config) : undefined,
      }))
    : [createVersionRecord(platform)];
  preserveVersionOnSave[platform] = Boolean(storedDraft?.preserveVersionOnSave?.[platform]);
});

selectedModuleId.value = configs.desktop.modules[0]?.id || '';

const currentConfig = computed(() => configs[activePlatform.value]);
function ensureRequiredMobileBottomNav(config: HomeConfig = currentConfig.value, platform: Platform = activePlatform.value) {
  if (platform === 'desktop' || !config.templateId) return;
  config.pageLayout.bottomNavEnabled = true;
  if (!config.modules.some((module) => module.type === 'bottomNav')) {
    insertModuleIntoList(config.modules, createModule(bottomNavDescriptor(config.templateId), config.templateId));
    sortModulesByZone(config.modules);
  }
}
const currentPlatform = computed(() => platformMeta[activePlatform.value]);
const sharedLayoutMeta = computed(() => getSharedLayout(sharedLayoutId));
const sharedReferenceCount = computed(() => isSharedEditFlow && sharedLayoutId
  ? getSharedLayoutReferences(sharedLayoutId, activePlatform.value).length
  : 0);
const currentLayoutMeta = computed(() => layoutCatalog.find((item) => item.home === currentConfig.value.templateId));
const pageRatioOptions = computed(() => {
  const values = currentConfig.value.pageLayout.columns === 3 ? ['1:1:1', '1:2:1', '1:1:2', '2:1:1', '1:3:1'] : ['3:7', '7:3', '5:5', '6:4', '4:6'];
  return values.map((value) => ({ label: value, value }));
});
const pageLayoutColumnWidths = computed(() => {
  const layout = currentConfig.value.pageLayout;
  const parts = layout.columns === 1 ? [1] : layout.columnRatio.split(':').map(Number);
  const availableWidth = Math.max(0, layout.contentWidth - layout.columnGap * (layout.columns - 1));
  const total = parts.reduce((sum, value) => sum + value, 0) || 1;
  return parts.map((part, index) => ({ label: `${index + 1} 區`, width: Math.round((availableWidth * part) / total) }));
});
const pageLayoutGuideStyle = computed(() => ({
  left: `${Math.max(0, (currentConfig.value.pageLayout.outerWidth - currentConfig.value.pageLayout.contentWidth) / 2)}px`,
  width: `${currentConfig.value.pageLayout.contentWidth}px`,
  gridTemplateColumns: pageLayoutColumnWidths.value.map((column) => `${column.width}px`).join(' '),
}));
const canvasContentStyle = computed<Record<string, string | number>>(() => {
  if (activePlatform.value !== 'desktop') return {} as Record<string, string | number>;
  const layout = currentConfig.value.pageLayout;
  const columns = pageLayoutColumnWidths.value;
  const outerGutter = Math.max(0, (layout.outerWidth - layout.contentWidth) / 2);
  const tracks: string[] = [`${outerGutter}px`];
  columns.forEach((column, index) => {
    tracks.push(`${column.width}px`);
    if (index < columns.length - 1) tracks.push(`${layout.columnGap}px`);
  });
  tracks.push(`${outerGutter}px`);
  return {
    display: 'grid',
    gridTemplateColumns: tracks.join(' '),
    alignItems: 'start',
  };
});
const currentModule = computed(() => {
  const module = currentConfig.value.modules.find((item) => item.id === selectedModuleId.value);
  if (module?.type === 'games') ensureGameDisplayConfig(module);
  return module;
});
const selectedTheme = computed(() => themeCatalog.find((theme) => theme.id === currentConfig.value.pageLayout.themeId));
const sourceThemeLabels = computed(() => {
  const siteKeys = new Set((currentLayoutMeta.value?.sites || []).map((site) => site.toLowerCase()));
  return themeCatalog
    .filter((theme) => theme.sites.some((site) => siteKeys.has(site.toLowerCase())))
    .map((theme) => theme.label)
    .join('、');
});
function themeRadius(theme: (typeof themeCatalog)[number]) {
  const radius = theme.buttonRadius.match(/\d+(?:\.\d+)?px/);
  if (radius) return radius[0];
  return theme.buttonRadius.includes('0') ? '0' : '4px';
}
function themeStyle(config: HomeConfig): Record<string, string> {
  const theme = themeCatalog.find((item) => item.id === config.pageLayout.themeId);
  if (!theme) {
    return {
      '--fc-theme-background': '#f8fafc',
      '--fc-theme-primary': '#94a3b8',
      '--fc-theme-primary-dark': '#64748b',
      '--fc-theme-primary-button': '#94a3b8',
      '--fc-theme-secondary-button': '#cbd5e1',
      '--fc-theme-button-radius': '4px',
      '--fc-theme-design-form': 'neutral',
    };
  }
  const style: Record<string, string> = {
    '--fc-theme-background': theme.background,
    '--fc-theme-primary': theme.buttonColor,
    '--fc-theme-primary-dark': theme.buttonColor,
    '--fc-theme-button-radius': themeRadius(theme),
    '--fc-theme-design-form': theme.designForm,
  };
  if (!theme.primaryButton.startsWith('TBD')) style['--fc-theme-primary-button'] = theme.primaryButton;
  if (!theme.secondaryButton.startsWith('TBD')) style['--fc-theme-secondary-button'] = theme.secondaryButton;
  return style;
}
const currentModuleSettingScope = computed<ModuleSettingScope>(() => {
  const module = currentModule.value;
  if (!module) return { source: '—', configurable: '—', readonly: '—' };
  if (module.type === 'topNav') return { source: '首頁導航配置', configurable: 'Logo、入口圖標、排序、展示形式', readonly: '固定路由、登入／註冊行為' };
  if (module.type === 'screenBanner') return { source: '既有下載推廣配置', configurable: '展示形式、排序、移除', readonly: '圖片、文案、關閉行為' };
  if (module.type === 'banner') return { source: '活動 Banner 配置', configurable: '展示形式、比例、排序、PC 張數、對齊', readonly: '圖片、活動標題、描述、活動排序' };
  if (module.type === 'notice') return { source: '公告配置', configurable: '展示形式、排序、移除', readonly: '公告內容、跳轉行為' };
  if (module.type === 'category') return { source: '遊戲配置', configurable: '原頁切換、展示形式、圖標、排序、移除', readonly: '分類資料、入口路由' };
  if (module.type === 'games') return { source: '遊戲配置', configurable: '展示形式、RTP、排序、移除', readonly: '場館與子分類在版面設定；資料源仍依主大類／供應商／子遊戲' };
  if (module.type === 'info') return { source: '既有資訊配置', configurable: '展示形式、排序、移除', readonly: '中獎／排行／說明資料' };
  if (module.type === 'footer') return { source: '品牌與 Footer 配置', configurable: '展示形式、排序、移除', readonly: '品牌文字、外鏈、合作內容' };
  if (module.type === 'bottomNav') return { source: '既有底部導航入口', configurable: '入口排序、啟用／未啟用圖標、展示形式', readonly: '固定路由、入口行為' };
  if (module.type === 'floating') return { source: '固定入口配置', configurable: '圖標、邊緣位置、排序、展示頁、移除', readonly: '固定路由、入口行為' };
  return { source: '既有前台功能配置', configurable: '展示形式、排序、移除', readonly: '功能資料、固定路由、既有交互' };
});
const currentGameVenues = computed(() => currentConfig.value.pageLayout.gameVenues || []);
const gamePickerTarget = computed(() => {
  return findGameSubcategory(gamePickerVenueId.value, gamePickerSubcategoryId.value);
});
const gamePickerProviders = computed(() => gameProviderCatalog.filter((provider) => provider.mainCategoryIds.some((id) => gamePickerMainCategoryIds.value.includes(id))));
const gamePickerResults = computed(() => {
  const query = gamePickerSearch.value.trim().toLowerCase();
  if (!gamePickerMainCategoryIds.value.length || !gamePickerProviderIds.value.length) return [];
  return gameCatalog.filter((game) => {
    const matchesCategory = game.mainCategoryIds.some((id) => gamePickerMainCategoryIds.value.includes(id));
    const matchesProvider = gamePickerProviderIds.value.includes(game.providerId);
    const matchesSearch = !query || `${game.name} ${game.providerName}`.toLowerCase().includes(query);
    return matchesCategory && matchesProvider && matchesSearch;
  });
});
const gamePickerAllResultsSelected = computed(() => Boolean(gamePickerResults.value.length) && gamePickerResults.value.every((game) => gamePickerGameIds.value.includes(game.id)));
function gameVenueIndex(venueId: string) {
  return currentGameVenues.value.findIndex((venue) => venue.id === venueId);
}
function gameSubcategoryIndex(venueId: string, subcategoryId: string) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  return venue?.subcategories.findIndex((item) => item.id === subcategoryId) ?? -1;
}
function setGameVenueName(venueId: string, event: Event) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  if (!venue) return;
  venue.name = (event.target as HTMLInputElement).value;
  markDirty(true, false);
}
function setEntryDisplayMode(value: GameDisplayMode) {
  if (!currentModule.value || currentModule.value.type !== 'category') return;
  currentModule.value.entryDisplayMode = value;
  markDirty();
}
function setEntryIconVisible(value: boolean) {
  if (!currentModule.value || currentModule.value.type !== 'category') return;
  currentModule.value.iconVisible = value;
  markDirty();
}
function checkedValue(event: Event) {
  return (event.target as HTMLInputElement).checked;
}
function addGameVenue() {
  ensurePageGameVenueConfig(currentConfig.value.pageLayout);
  currentConfig.value.pageLayout.gameVenues.push({ id: `page-venue-${Date.now()}`, name: '新場館', subcategories: [] });
  markDirty(true, false);
}
function removeGameVenue(venueId: string) {
  const venues = currentConfig.value.pageLayout.gameVenues;
  if (!venues.length) return;
  dialog.warning({
    title: '刪除場館',
    content: '刪除後，場館下的子分類與遊戲選擇會一併移除。',
    positiveText: '確認刪除',
    negativeText: '取消',
    onPositiveClick: () => {
      currentConfig.value.pageLayout.gameVenues = venues.filter((venue) => venue.id !== venueId);
      markDirty(true, false);
    },
  });
}
function moveGameVenue(venueId: string, offset: number) {
  const venues = currentGameVenues.value;
  const index = gameVenueIndex(venueId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= venues.length) return;
  const [venue] = venues.splice(index, 1);
  venues.splice(target, 0, venue);
  markDirty(true, false);
}
function setGameSubcategoryName(venueId: string, subcategoryId: string, event: Event) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  const subcategory = venue?.subcategories.find((item) => item.id === subcategoryId);
  if (!subcategory) return;
  subcategory.name = (event.target as HTMLInputElement).value;
  markDirty(true, false);
}
function addGameSubcategory(venueId: string) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  if (!venue) return;
  venue.subcategories.push(defaultGameSubcategory(`${venue.id}-sub-${Date.now()}`, '新子分類', ['slots'], ['pg', 'jdb']));
  markDirty(true, false);
}
function removeGameSubcategory(venueId: string, subcategoryId: string) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  if (!venue) return;
  dialog.warning({
    title: '刪除子分類',
    content: '刪除後，子分類名稱與已選遊戲會一併移除。',
    positiveText: '確認刪除',
    negativeText: '取消',
    onPositiveClick: () => {
      venue.subcategories = venue.subcategories.filter((item) => item.id !== subcategoryId);
      markDirty(true, false);
    },
  });
}
function moveGameSubcategory(venueId: string, subcategoryId: string, offset: number) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  if (!venue) return;
  const index = gameSubcategoryIndex(venueId, subcategoryId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= venue.subcategories.length) return;
  const [subcategory] = venue.subcategories.splice(index, 1);
  venue.subcategories.splice(target, 0, subcategory);
  markDirty(true, false);
}
function setGameSubcategoryDisplayMode(venueId: string, subcategoryId: string, value: GameDisplayMode) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  const subcategory = venue?.subcategories.find((item) => item.id === subcategoryId);
  if (!subcategory) return;
  subcategory.displayMode = value;
  markDirty(true, false);
}
function setGameSubcategoryIconVisible(venueId: string, subcategoryId: string, value: boolean) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  const subcategory = venue?.subcategories.find((item) => item.id === subcategoryId);
  if (!subcategory) return;
  subcategory.iconVisible = value;
  markDirty(true, false);
}
function openGamePicker(venueId: string, subcategoryId: string) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  const subcategory = venue?.subcategories.find((item) => item.id === subcategoryId);
  if (!subcategory) return;
  gamePickerVenueId.value = venueId;
  gamePickerSubcategoryId.value = subcategoryId;
  gamePickerMainCategoryIds.value = subcategory.mainCategoryIds.length ? [...subcategory.mainCategoryIds] : gameMainCategoryCatalog.map((item) => item.id);
  const providerIds = gameProviderCatalog.filter((provider) => provider.mainCategoryIds.some((id) => gamePickerMainCategoryIds.value.includes(id))).map((provider) => provider.id);
  gamePickerProviderIds.value = subcategory.providerIds.length ? [...subcategory.providerIds] : providerIds;
  gamePickerGameIds.value = [...subcategory.gameIds];
  gamePickerSearch.value = '';
  gamePickerVisible.value = true;
}
function toggleGamePickerMainCategory(id: string, checked: boolean) {
  gamePickerMainCategoryIds.value = checked ? [...new Set([...gamePickerMainCategoryIds.value, id])] : gamePickerMainCategoryIds.value.filter((item) => item !== id);
  const validProviderIds = new Set(gamePickerProviders.value.map((provider) => provider.id));
  gamePickerProviderIds.value = gamePickerProviderIds.value.filter((id) => validProviderIds.has(id));
}
function toggleGamePickerProvider(id: string, checked: boolean) {
  gamePickerProviderIds.value = checked ? [...new Set([...gamePickerProviderIds.value, id])] : gamePickerProviderIds.value.filter((item) => item !== id);
}
function toggleGamePickerGame(id: string, checked: boolean) {
  gamePickerGameIds.value = checked ? [...new Set([...gamePickerGameIds.value, id])] : gamePickerGameIds.value.filter((item) => item !== id);
}
function toggleAllGamePickerMainCategories() {
  gamePickerMainCategoryIds.value = gamePickerMainCategoryIds.value.length === gameMainCategoryCatalog.length ? [] : gameMainCategoryCatalog.map((item) => item.id);
  gamePickerProviderIds.value = gamePickerMainCategoryIds.value.length ? gameProviderCatalog.map((item) => item.id) : [];
}
function toggleAllGamePickerProviders() {
  const ids = gamePickerProviders.value.map((provider) => provider.id);
  const allSelected = ids.length > 0 && ids.every((id) => gamePickerProviderIds.value.includes(id));
  gamePickerProviderIds.value = allSelected ? [] : ids;
}
function toggleAllGamePickerGames() {
  const ids = gamePickerResults.value.map((game) => game.id);
  const allSelected = ids.length > 0 && ids.every((id) => gamePickerGameIds.value.includes(id));
  gamePickerGameIds.value = allSelected ? gamePickerGameIds.value.filter((id) => !ids.includes(id)) : [...new Set([...gamePickerGameIds.value, ...ids])];
}
function handleGameListUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const tokens = String(reader.result || '')
      .split(/[\n\r,，;；\t]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const tokenSet = new Set(tokens);
    const matchedIds = gameCatalog
      .filter((game) => tokenSet.has(game.id.toLowerCase()) || tokenSet.has(game.name.toLowerCase()))
      .map((game) => game.id);
    if (!matchedIds.length) {
      message.warning('清單內沒有匹配的子遊戲。');
      input.value = '';
      return;
    }
    gamePickerGameIds.value = [...new Set([...gamePickerGameIds.value, ...matchedIds])];
    message.success(`已匯入 ${matchedIds.length} 款子遊戲。`);
    input.value = '';
  };
  reader.readAsText(file);
}
function saveGamePicker() {
  const target = gamePickerTarget.value;
  if (!target) return;
  target.subcategory.mainCategoryIds = [...gamePickerMainCategoryIds.value];
  target.subcategory.providerIds = [...gamePickerProviderIds.value];
  target.subcategory.gameIds = [...gamePickerGameIds.value];
  gamePickerVisible.value = false;
  markDirty(true, false);
}
function moduleWithPageGameVenues(module: ModuleConfig, config: HomeConfig) {
  return module.type === 'games'
    ? { ...module, gameVenues: config.pageLayout.gameVenues }
    : module;
}
const bottomNavModule = computed(() => currentConfig.value.modules.find((item) => item.type === 'bottomNav'));
const canvasAuthStates = computed<AuthState[]>(() => activePlatform.value === 'desktop'
  ? [currentConfig.value.pageLayout.authState]
  : ['loggedOut', 'loggedIn']);
const currentStatus = computed(() => statusByPlatform[activePlatform.value]);
function statusTagType(status: Status | string) {
  if (status === '待審批') return 'info';
  if (status === '已發布') return 'success';
  if (status === '發布失敗') return 'error';
  return 'warning';
}
function sortedVersionHistory(platform: Platform | string) {
  return [...versionHistoryByPlatform[platform as Platform]].sort((a, b) => b.version - a.version);
}
function currentRecordFor(platform: Platform) {
  return versionHistoryByPlatform[platform].find((record) => record.version === versions[platform]) || null;
}
function ensureCurrentRecord(platform: Platform) {
  const existing = currentRecordFor(platform);
  if (existing) return existing;
  const record = createVersionRecord(platform);
  versionHistoryByPlatform[platform].push(record);
  return record;
}
function updateCurrentRecord(platform: Platform, patch: Partial<VersionRecord>) {
  const record = ensureCurrentRecord(platform);
  Object.assign(record, patch);
  record.config = cloneHomeConfig(configs[platform]);
  return record;
}
function isRollbackAvailable(platform: Platform | string, record: VersionRecord) {
  const key = platform as Platform;
  const allowed = sortedVersionHistory(key)
    .filter((item) => item.status === '已發布' && item.version !== versions[key])
    .slice(0, 5);
  return allowed.some((item) => item.version === record.version) && Boolean(record.config);
}
const previewConfig = computed(() => configs[previewPlatform.value]);
const previewBottomNavModule = computed(() => previewConfig.value.modules.find((item) => item.type === 'bottomNav'));
const previewMeta = computed(() => platformMeta[previewPlatform.value]);
const previewDimensions: Record<Platform, { width: number; height: number }> = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
  app: { width: 375, height: 812 },
};
const canvasRef = ref<HTMLElement | null>(null);
const previewDeviceRef = ref<HTMLElement | null>(null);
const canvasScale = ref(1);
const previewScale = ref(1);
const floatingDragId = ref<string | null>(null);
let canvasResizeObserver: ResizeObserver | null = null;
let previewResizeObserver: ResizeObserver | null = null;

function getPreviewScale(element: HTMLElement | null, platform: Platform, baseSize = previewDimensions[platform]) {
  if (!element) return 1;
  const style = getComputedStyle(element);
  const width = Math.max(1, element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth));
  const height = Math.max(1, element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth));
  return Math.min(width / baseSize.width, height / baseSize.height);
}

function refreshCanvasScale() {
  const baseSize = activePlatform.value === 'desktop'
    ? previewDimensions.desktop
    : { width: 774, height: 836 };
  canvasScale.value = getPreviewScale(canvasRef.value, activePlatform.value, baseSize);
}

function refreshPreviewScale() {
  previewScale.value = getPreviewScale(previewDeviceRef.value, previewPlatform.value);
}

function floatingModuleStyle(module: ModuleConfig, platform: Platform = activePlatform.value) {
  const edge = module.floatingEdge || 'right';
  const size = previewDimensions[platform];
  const offset = Math.max(12, module.floatingOffset ?? size.height * 0.44);
  const style: Record<string, string | number> = { position: 'absolute', zIndex: 4, width: 'auto', margin: 0 };
  if (edge === 'left' || edge === 'right') {
    style[edge] = '12px';
    style.top = `${Math.min(offset, size.height - 72)}px`;
  } else {
    style[edge] = '12px';
    style.left = `${Math.min(offset, size.width - 72)}px`;
  }
  return style;
}
function layoutModuleStyle(module: ModuleConfig) {
  if (activePlatform.value !== 'desktop') return undefined;
  const modules = currentConfig.value.modules;
  const layout = currentConfig.value.pageLayout;
  const fullWidthStyle = { gridColumn: '1 / -1', width: '100%', maxWidth: 'none', marginInline: '0' };
  if (module.type === 'floating') return fullWidthStyle;
  if (module.zone !== 'content') {
    const index = modules.filter((item) => item.zone === module.zone).findIndex((item) => item.id === module.id);
    const topCount = modules.filter((item) => item.zone === 'top').length;
    const contentCount = modules.filter((item) => item.zone === 'content').length;
    const contentRows = Math.max(1, Math.ceil(contentCount / layout.columns));
    const row = module.zone === 'top'
      ? index + 1
      : topCount + contentRows + index + 1;
    return { ...fullWidthStyle, gridRow: row };
  }
  const contentModules = modules.filter((item) => item.zone === 'content');
  const contentIndex = contentModules.findIndex((item) => item.id === module.id);
  const columnIndex = Math.max(0, contentIndex % layout.columns);
  const column = pageLayoutColumnWidths.value[columnIndex];
  const topCount = modules.filter((item) => item.zone === 'top').length;
  return {
    gridColumn: String(2 + columnIndex * 2),
    gridRow: topCount + Math.floor(Math.max(0, contentIndex) / layout.columns) + 1,
    width: `${column?.width || layout.contentWidth}px`,
    maxWidth: `${column?.width || layout.contentWidth}px`,
    marginInline: '0',
  };
}

function beginFloatingDrag(event: PointerEvent, module: ModuleConfig) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  selectedModuleId.value = module.id;
  floatingDragId.value = module.id;
  window.addEventListener('pointermove', handleFloatingDrag);
  window.addEventListener('pointerup', endFloatingDrag, { once: true });
}

function handleFloatingDrag(event: PointerEvent) {
  const module = currentConfig.value.modules.find((item) => item.id === floatingDragId.value);
  const canvas = canvasRef.value;
  if (!module || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const size = previewDimensions[activePlatform.value];
  const x = Math.max(0, Math.min(size.width, ((event.clientX - rect.left) / Math.max(rect.width, 1)) * size.width));
  const y = Math.max(0, Math.min(size.height, ((event.clientY - rect.top + canvas.scrollTop) / Math.max(rect.height, 1)) * size.height));
  const distances = { left: x, right: size.width - x, top: y, bottom: size.height - y };
  const edge = (Object.entries(distances).sort((a, b) => a[1] - b[1])[0]?.[0] || 'right') as ModuleConfig['floatingEdge'];
  module.floatingEdge = edge;
  module.floatingOffset = edge === 'left' || edge === 'right' ? y : x;
  markDirty();
}

function endFloatingDrag() {
  window.removeEventListener('pointermove', handleFloatingDrag);
  floatingDragId.value = null;
}

function observeCanvas() {
  canvasResizeObserver?.disconnect();
  if (!canvasRef.value) return;
  canvasResizeObserver = new ResizeObserver(refreshCanvasScale);
  canvasResizeObserver.observe(canvasRef.value);
  refreshCanvasScale();
}

function observePreviewDevice() {
  previewResizeObserver?.disconnect();
  if (!previewDeviceRef.value) return;
  previewResizeObserver = new ResizeObserver(refreshPreviewScale);
  previewResizeObserver.observe(previewDeviceRef.value);
  refreshPreviewScale();
}

watch(activePlatform, () => nextTick(observeCanvas));
watch([activePlatform, () => currentConfig.value.templateId], () => {
  ensurePageGameVenueConfig(currentConfig.value.pageLayout);
  ensureRequiredMobileBottomNav();
  nextTick(observeCanvas);
}, { immediate: true });
watch(() => currentConfig.value.modules.length, () => nextTick(observeCanvas));
watch([previewVisible, previewPlatform], () => nextTick(observePreviewDevice));
onMounted(() => nextTick(() => {
  observeCanvas();
  observePreviewDevice();
}));
onBeforeUnmount(() => {
  canvasResizeObserver?.disconnect();
  previewResizeObserver?.disconnect();
  endFloatingDrag();
});
const canSubmit = computed(() => {
  const config = currentConfig.value;
  const requiredReady = config.modules.some((module) => module.required)
    && config.modules.filter((module) => module.required).every((module) => Boolean(module.id && module.type && module.variant));
  return Boolean(config.templateId && requiredReady && previewed[activePlatform.value] && !dirtyByPlatform[activePlatform.value] && currentStatus.value === '草稿');
});
const canProceedToModules = computed(() => {
  const config = currentConfig.value;
  const templateReady = activePlatform.value === 'desktop' || Boolean(config.templateId);
  return Boolean(templateReady && config.pageLayout.themeId);
});
function goToNextStep() {
  if (!canProceedToModules.value) {
    message.warning('請完成模板與主題。');
    return;
  }
  processStep.value = processStep.value === 1 ? 2 : 3;
  libraryCategory.value = null;
  inspectorTab.value = processStep.value === 2 ? 'library' : 'settings';
}
const availableLibrary = computed(() => {
  const base = library.filter((item) => {
    if (activePlatform.value === 'desktop' && item.type === 'bottomNav') return false;
    if (activePlatform.value !== 'desktop' && item.variant === 'sideNav') return false;
    return true;
  });
  const configuredCategories = new Set(currentConfig.value.modules.map((module) => moduleCategory(module)));
  const configuredKeys = new Set(currentConfig.value.modules.map((module) => `${module.type}:${module.variant}`));
  return base.filter((item) => {
    const category = moduleCategory(item);
    if (category === 'games' || category === 'custom') return !configuredKeys.has(`${item.type}:${item.variant}`);
    return !configuredCategories.has(category) && !configuredKeys.has(`${item.type}:${item.variant}`);
  });
});
const libraryGroups = computed(() => {
  const groups = new Map<ModuleCategory, LibraryItem[]>();
  availableLibrary.value.forEach((item) => {
    const category = moduleCategory(item);
    groups.set(category, [...(groups.get(category) || []), item]);
  });
  return moduleCategoryMeta
    .filter((meta) => groups.has(meta.key))
    .map((meta) => ({ category: meta.key, label: meta.label, symbol: meta.symbol, count: groups.get(meta.key)?.length || 0, multiple: meta.multiple }));
});
const libraryCategoryItems = computed(() => libraryCategory.value
  ? availableLibrary.value.filter((item) => moduleCategory(item) === libraryCategory.value)
  : []);
const libraryCategoryLabel = computed(() => moduleCategoryMeta.find((meta) => meta.key === libraryCategory.value)?.label || '模組形式');
const variantOptions = computed(() => {
  const module = currentModule.value;
  if (!module) return [];
  if (module.type === 'topNav') {
    return topNavFormLibrary.map((item) => ({ label: item.label, value: item.variant, note: item.note, referenceAsset: item.referenceAsset }));
  }
  const category = moduleCategory(module);
  const options = library
    .filter((item) => item.type === module.type && item.zone === module.zone && moduleCategory(item) === category)
    .map((item) => ({ label: item.label, value: item.variant, note: item.note, referenceAsset: item.referenceAsset }));
  return options;
});
const categoryVariantOptions = computed(() => library.filter((item) => item.type === 'category'));
const configuredTopNavButtons = computed(() => {
  if (currentModule.value?.type !== 'topNav') return [];
  const keys = currentModule.value.buttonKeys || [];
  return topNavButtonCatalog.filter((item) => keys.includes(item.key));
});
const unconfiguredTopNavButtons = computed(() => {
  if (currentModule.value?.type !== 'topNav') return [];
  const keys = currentModule.value.buttonKeys || [];
  return topNavButtonCatalog.filter((item) => !keys.includes(item.key));
});
function parseBottomNavIconTarget(target: string) {
  const match = target.match(/^bottom:([^:]+):(active|inactive)$/);
  return match ? { entryKey: match[1], state: match[2] as 'active' | 'inactive' } : null;
}
function parseGameIconTarget(target: string) {
  const match = target.match(/^game:([^:]+):([^:]+)$/);
  return match ? { venueId: match[1], subcategoryId: match[2] } : null;
}
function findGameSubcategory(venueId: string, subcategoryId: string) {
  const venue = currentGameVenues.value.find((item) => item.id === venueId);
  const subcategory = venue?.subcategories.find((item) => item.id === subcategoryId);
  return venue && subcategory ? { venue, subcategory } : undefined;
}
const iconLibraryTargetMeta = computed(() => {
  const bottomTarget = parseBottomNavIconTarget(iconLibraryTarget.value);
  if (bottomTarget) {
    const entry = bottomNavEntryCatalog.find((item) => item.key === bottomTarget.entryKey);
    return entry ? { key: iconLibraryTarget.value, label: `${entry.label}${bottomTarget.state === 'active' ? '啟用' : '未啟用'}`, note: '入口路由固定，只更換圖標' } : undefined;
  }
  const gameTarget = parseGameIconTarget(iconLibraryTarget.value);
  if (gameTarget) {
    const target = findGameSubcategory(gameTarget.venueId, gameTarget.subcategoryId);
    return target ? { key: iconLibraryTarget.value, label: `${target.venue.name}／${target.subcategory.name}`, note: '場館與子分類名稱不變，只更換展示圖標' } : undefined;
  }
  if (iconLibraryTarget.value === 'floating' && currentModule.value?.type === 'floating') {
    const functionMeta = floatingIconFunctionCatalog.find((item) => item.key === (currentModule.value?.floatingIconFunction || 'rewardCenter'));
    return functionMeta ? { key: 'floating', label: functionMeta.label, note: '固定入口功能與路由不變，只更換圖標' } : undefined;
  }
  if (iconLibraryTarget.value === 'notice' && currentModule.value?.type === 'notice') {
    return { key: 'notice', label: '跑馬燈', note: '公告內容與固定路由不變，只更換圖標' };
  }
  return topNavButtonCatalog.find((item) => item.key === iconLibraryTarget.value);
});
const iconLibraryOptions = computed(() => {
  const bottomTarget = parseBottomNavIconTarget(iconLibraryTarget.value);
  if (bottomTarget) return bottomNavIconLibrary[bottomTarget.entryKey] || [];
  if (parseGameIconTarget(iconLibraryTarget.value)) return gameEntryIconLibrary;
  if (iconLibraryTarget.value === 'floating') return floatingIconLibrary[currentModule.value?.floatingIconFunction || 'rewardCenter'] || [];
  if (iconLibraryTarget.value === 'notice') return noticeIconLibrary;
  return topNavIconLibrary[iconLibraryTarget.value] || [];
});
const iconLibrarySelectedKey = computed(() => {
  const bottomTarget = parseBottomNavIconTarget(iconLibraryTarget.value);
  if (bottomTarget && currentModule.value?.type === 'bottomNav') {
    const entry = currentModule.value.bottomNavItems?.find((item) => item.key === bottomTarget.entryKey);
      return entry?.[`${bottomTarget.state}IconKey`] || `${bottomTarget.entryKey}-${bottomTarget.state === 'active' ? 'filled' : 'outline'}`;
  }
  const gameTarget = parseGameIconTarget(iconLibraryTarget.value);
  if (gameTarget) {
    return findGameSubcategory(gameTarget.venueId, gameTarget.subcategoryId)?.subcategory.iconKey || 'games-outline';
  }
  if (currentModule.value?.type === 'floating' && iconLibraryTarget.value === 'floating') {
    return currentModule.value.floatingIconKey || currentModule.value.floatingIconFunction || 'rewardCenter';
  }
  if (currentModule.value?.type === 'notice' && iconLibraryTarget.value === 'notice') {
    return currentModule.value.noticeIconKey || 'notice';
  }
  if (currentModule.value?.type !== 'topNav') return '';
  return currentModule.value.buttonIconKeys?.[iconLibraryTarget.value] || iconLibraryTarget.value;
});
function zoneLabel(zone: Zone) {
  return ({ top: '頂部導航', content: '內容區', footer: 'Footer', bottom: '底部導航', floating: '浮標層' })[zone];
}
function previewModule(item: LibraryItem): ModuleConfig {
  return { id: `preview-${item.variant}`, type: item.type, variant: item.variant, label: item.label, detail: item.note, zone: item.zone, slot: 'preview', ratio: '' };
}
function previewVariant(item: { label: string; value: string; note: string }): ModuleConfig {
  const module = currentModule.value;
  if (!module) return previewModule({ type: 'function', variant: item.value, label: item.label, note: item.note, symbol: '', zone: 'content', compatibility: 'ready' });
  return { ...module, id: `preview-${module.type}-${item.value}`, variant: item.value, label: item.label, detail: item.note };
}
function markDirty(markAsCustom = true, markCurrentModule = true) {
  if (statusByPlatform[activePlatform.value] === '待審批') {
    const platform = activePlatform.value;
    configs[platform] = cloneHomeConfig(savedConfigs[platform]);
    previewed[platform] = savedPreviewed[platform];
    statusByPlatform[platform] = savedStatusByPlatform[platform];
    dirtyByPlatform[platform] = false;
    selectedModuleId.value = configs[platform].modules[0]?.id || '';
    message.warning('審批中的版本不可編輯，請先退回後再修改。');
    return;
  }
  dirty.value = true;
  previewed[activePlatform.value] = false;
  statusByPlatform[activePlatform.value] = '草稿';
  if (markAsCustom && currentConfig.value.templateId) {
    currentConfig.value.isCustomTemplate = true;
    if (markCurrentModule) {
      const selected = currentConfig.value.modules.find((module) => module.id === selectedModuleId.value);
      if (selected) selected.isCustomModule = true;
    }
  }
}

function isFloatingVisible(module: ModuleConfig) {
  if (module.type !== 'floating') return true;
  ensureFloatingPageConfig(module);
  return Boolean(module.floatingPageKeys?.length);
}
function commitPlatformSwitch(platform: Platform) {
  activePlatform.value = platform;
  selectedModuleId.value = configs[platform].modules[0]?.id || '';
  processStep.value = 1;
  libraryCategory.value = null;
  inspectorTab.value = 'pageLayout';
}
function discardCurrentPlatformChanges() {
  const platform = activePlatform.value;
  configs[platform] = cloneHomeConfig(savedConfigs[platform]);
  previewed[platform] = savedPreviewed[platform];
  statusByPlatform[platform] = savedStatusByPlatform[platform];
  dirtyByPlatform[platform] = false;
  selectedModuleId.value = configs[platform].modules[0]?.id || '';
}
function selectPlatform(platform: string | null) {
  if (!platform || !platformMeta[platform as Platform]) return;
  const selectedPlatform = platform as Platform;
  if (selectedPlatform === activePlatform.value) return;
  if (!dirtyByPlatform[activePlatform.value]) {
    commitPlatformSwitch(selectedPlatform);
    return;
  }
  const leavingPlatform = activePlatform.value;
  const leavingMeta = platformMeta[leavingPlatform];
  const targetMeta = platformMeta[selectedPlatform];
  dialog.warning({
    title: `${leavingMeta.label}有未保存變更`,
    content: `目前狀態：${statusByPlatform[leavingPlatform]}。切換至${targetMeta.label}前，是否保存為${leavingMeta.short}草稿？`,
    positiveText: '保存草稿並切換',
    negativeText: '捨棄變更並切換',
    onPositiveClick: () => {
      saveDraft();
      commitPlatformSwitch(selectedPlatform);
    },
    onNegativeClick: () => {
      discardCurrentPlatformChanges();
      commitPlatformSwitch(selectedPlatform);
    },
  });
}
function selectProcessStep(step: number) {
  const nextStep = Math.max(1, Math.min(3, Number(step) || 1));
  if (nextStep === 1) {
    processStep.value = 1;
    libraryCategory.value = null;
    inspectorTab.value = 'pageLayout';
    return;
  }
  if (activePlatform.value !== 'desktop' && !currentConfig.value.templateId) {
    processStep.value = 1;
    inspectorTab.value = 'pageLayout';
    message.warning('請先選模板。');
    return;
  }
  if (!canProceedToModules.value) {
    processStep.value = 1;
    inspectorTab.value = 'pageLayout';
    message.warning('請完成模板與主題。');
    return;
  }
  processStep.value = nextStep;
  if (nextStep === 2) {
    libraryCategory.value = null;
    inspectorTab.value = 'library';
  } else {
    inspectorTab.value = 'settings';
  }
}
function selectModule(id: string) {
  if (!canProceedToModules.value) {
    processStep.value = 1;
    inspectorTab.value = 'pageLayout';
    message.warning('請完成模板與主題。');
    return;
  }
  selectedModuleId.value = id;
  inspectorTab.value = processStep.value === 2 || processStep.value === 3 ? 'settings' : 'pageLayout';
}
function applyTemplate(templateId: string | null) {
  if (activePlatform.value === 'desktop') {
    message.info('PC 無模板。');
    return;
  }
  if (!templateId || !templateDescriptors[templateId]) return;
  const previousTemplateId = currentConfig.value.templateId;
  const previousDefaultTheme = defaultThemeForTemplate(previousTemplateId);
  const shouldApplyTemplateTheme = Boolean(previousTemplateId) && currentConfig.value.pageLayout.themeId === previousDefaultTheme;
  const oldModules = currentConfig.value.modules;
  const used = new Set<string>();
  const nextModules = descriptorsForPlatform(templateId, activePlatform.value).map((item) => {
    const match = oldModules.find((module) => module.slot === item.slot && module.type === item.type && !used.has(module.id));
    if (!match) return createModule(item, templateId);
    used.add(match.id);
    if (match.isCustomModule) {
      return { ...item, ...match, sourceTemplateId: templateId, isCustomModule: true };
    }
    const next = createModule(item, templateId);
    next.id = match.id;
    return next;
  });
  nextModules.forEach((module) => {
    if (module.type !== 'topNav') return;
    if (module.variant === 'raja') {
      module.buttonKeys = ['notification', 'customerService'];
      module.buttonIconKeys = { notification: 'notification', customerService: 'customerService' };
    } else if (module.variant === 'okwin') {
      module.buttonKeys = ['download', 'language'];
      module.buttonIconKeys = { download: 'download', language: 'language' };
    } else if (module.variant === 'blackGold') {
      module.buttonKeys = ['download', 'customerService', 'language'];
      module.buttonIconKeys = { download: 'download', customerService: 'customerService', language: 'language' };
    } else if (module.variant === 'daman') {
      module.buttonKeys = ['notification'];
      module.buttonIconKeys = { notification: 'notification' };
    } else if (module.variant === 'goGame') {
      module.buttonKeys = [];
      module.buttonIconKeys = {};
    } else if (module.variant === 'public5WhiteGreen') {
      module.buttonKeys = ['notification', 'download'];
      module.buttonIconKeys = { notification: 'notification', download: 'download' };
    } else if (module.variant === 'public7') {
      module.buttonKeys = ['wallet', 'download', 'language'];
      module.buttonIconKeys = { wallet: 'wallet', download: 'download', language: 'language' };
    } else if (module.variant === 'electronicNav' || module.variant === 'red096') {
      module.buttonKeys = ['download', 'customerService'];
      module.buttonIconKeys = { download: 'download', customerService: 'customerService' };
    } else if (module.variant === 'public5BlackGold' || module.variant === 'club') {
      module.buttonKeys = ['download'];
      module.buttonIconKeys = { download: 'download' };
    }
  });
  if (currentConfig.value.pageLayout.bottomNavEnabled === true) {
    const bottom = oldModules.find((module) => module.type === 'bottomNav' && !used.has(module.id));
    const item = bottomNavDescriptor(templateId);
    if (bottom?.isCustomModule) {
      nextModules.push({ ...item, ...bottom, sourceTemplateId: templateId, isCustomModule: true });
    } else {
      const nextBottom = createModule(item, templateId);
      if (bottom) nextBottom.id = bottom.id;
      insertModuleIntoList(nextModules, nextBottom);
    }
    if (bottom) used.add(bottom.id);
  }
  const preservedCustomModules = oldModules.filter((module) => !used.has(module.id) && module.isCustomModule);
  nextModules.push(...preservedCustomModules);
  sortModulesByZone(nextModules);
  currentConfig.value.templateId = templateId;
  currentConfig.value.isCustomTemplate = currentConfig.value.isCustomTemplate || nextModules.some((module) => module.isCustomModule);
  if (shouldApplyTemplateTheme) currentConfig.value.pageLayout.themeId = defaultThemeForTemplate(templateId);
  currentConfig.value.pageLayout.sideNavEnabled = nextModules.some((module) => module.variant === 'sideNav');
  currentConfig.value.modules = nextModules;
  selectedModuleId.value = nextModules[0]?.id || '';
  processStep.value = 1;
  libraryCategory.value = null;
  inspectorTab.value = 'pageLayout';
  markDirty(false);
  message.success('已套用模板。');
}
function insertModuleIntoList(modules: ModuleConfig[], module: ModuleConfig) {
  const sameZoneIndexes = modules
    .map((item, index) => (item.zone === module.zone ? index : -1))
    .filter((index) => index >= 0);
  const lastSameZoneIndex = sameZoneIndexes[sameZoneIndexes.length - 1];
  if (lastSameZoneIndex !== undefined) {
    modules.splice(lastSameZoneIndex + 1, 0, module);
    return;
  }
  const firstLaterZone = modules.findIndex((item) => moduleZoneOrder[item.zone] > moduleZoneOrder[module.zone]);
  modules.splice(firstLaterZone < 0 ? modules.length : firstLaterZone, 0, module);
}
function insertModuleByZone(module: ModuleConfig) {
  insertModuleIntoList(currentConfig.value.modules, module);
}
function applyLibrary(item: LibraryItem) {
  const category = moduleCategory(item);
  const categoryMeta = moduleCategoryMeta.find((meta) => meta.key === category);
  const alreadyConfigured = currentConfig.value.modules.some((module) => {
    if (category === 'games' || category === 'custom') {
      return module.type === item.type && module.variant === item.variant;
    }
    return moduleCategory(module) === category;
  });
  if (alreadyConfigured && !categoryMeta?.multiple) {
    message.info(`${item.label} 已在目前終端畫布中。`);
    return;
  }
  const added = createModule({
    ...descriptor(item.type, item.variant, item.label, item.note, item.zone, `${item.zone}-new-${idSeed + 1}`, false, category, item.interaction),
    referenceAsset: item.referenceAsset,
    sourceVariant: item.sourceVariant,
  });
  added.sourceTemplateId = currentConfig.value.templateId;
  added.isCustomModule = true;
  insertModuleByZone(added);
  selectedModuleId.value = added.id;
  processStep.value = 2;
  inspectorTab.value = 'settings';
  markDirty();
  message.success(`${item.label} 已加入目前終端的自定義模板。`);
}
function addModuleFromCategory(category: ModuleCategory) {
  libraryCategory.value = category;
}
function changeVariant(variant: string | null) {
  const module = currentModule.value;
  const item = library.find((entry) => entry.type === module?.type && entry.zone === module?.zone && entry.variant === variant);
  if (module && item) {
    Object.assign(module, {
      variant: item.variant,
      label: item.label,
      detail: item.note,
      category: moduleCategory(item),
      interaction: item.interaction,
      referenceAsset: item.referenceAsset,
      sourceVariant: item.sourceVariant,
    });
    module.isCustomModule = true;
    if (module.type === 'topNav') {
      applyTopNavSettings(module, item.variant, item.sourceVariant);
      if (item.variant === 'raja') {
        module.buttonKeys = ['notification', 'customerService'];
        module.buttonIconKeys = { notification: 'notification', customerService: 'customerService' };
      } else if (item.variant === 'okwin') {
        module.buttonKeys = ['download', 'language'];
        module.buttonIconKeys = { download: 'download', language: 'language' };
      } else if (item.variant === 'blackGold') {
        module.buttonKeys = ['download', 'customerService', 'language'];
        module.buttonIconKeys = { download: 'download', customerService: 'customerService', language: 'language' };
      } else if (item.variant === 'daman') {
        module.buttonKeys = ['notification'];
        module.buttonIconKeys = { notification: 'notification' };
      } else if (item.variant === 'goGame') {
        module.buttonKeys = [];
        module.buttonIconKeys = {};
      } else if (item.variant === 'electronicNav' || item.variant === 'red096') {
        module.buttonKeys = ['download', 'customerService'];
        module.buttonIconKeys = { download: 'download', customerService: 'customerService' };
      } else if (item.variant === 'public5BlackGold' || item.variant === 'club') {
        module.buttonKeys = ['download'];
        module.buttonIconKeys = { download: 'download' };
      } else if (!module.buttonKeys?.length) {
        module.buttonKeys = ['notification', 'download'];
        module.buttonIconKeys = { notification: 'notification', download: 'download' };
      }
    }
    if (item.variant === 'customDisplay') ensureCustomDisplayConfig(module);
    markDirty();
  }
}
function setTopNavPrimaryButton(value: 'login' | 'register') {
  const module = currentModule.value;
  if (!module || module.type !== 'topNav' || module.variant !== 'dualAuth') return;
  applyTopNavSettings(module, 'dualAuth', value === 'register' ? 'topnav02' : 'topnav01');
  markDirty();
}
function setTopNavAuthBar(value: boolean) {
  const module = currentModule.value;
  if (!module || module.type !== 'topNav' || module.variant !== 'wideLogo') return;
  applyTopNavSettings(module, 'wideLogo', value ? 'topnav04' : 'topnav03');
  markDirty();
}
function setRatio(ratio: string) {
  if (!currentModule.value) return;
  currentModule.value.ratio = ratio;
  markDirty();
}
function setBannerCount(value: number | null) {
  if (!currentModule.value || currentModule.value.type !== 'banner' || activePlatform.value !== 'desktop') return;
  currentModule.value.bannerCount = Math.max(0.1, Math.min(10, Number(value || 0.1)));
  markDirty();
}
function setBannerAlign(value: string | null) {
  if (!currentModule.value || currentModule.value.type !== 'banner') return;
  if (value !== 'left' && value !== 'center' && value !== 'right') return;
  currentModule.value.bannerAlign = value;
  markDirty();
}
function setPageColumns(value: number | null) {
  const columns = value === 2 || value === 3 ? value : 1;
  currentConfig.value.pageLayout.columns = columns;
  currentConfig.value.pageLayout.columnRatio = columns === 1 ? '1' : pageRatioOptions.value[0]?.value || (columns === 2 ? '3:7' : '1:1:1');
  markDirty(true, false);
}
function setPageContentWidth(value: number | null) {
  const widths: PageContentWidth[] = [1920, 1440, 1200, 1080];
  if (!value || !widths.includes(value as PageContentWidth)) return;
  currentConfig.value.pageLayout.contentWidth = value as PageContentWidth;
  markDirty(true, false);
}
function setPageColumnRatio(value: string | null) {
  if (!value || !pageRatioOptions.value.some((option) => option.value === value)) return;
  currentConfig.value.pageLayout.columnRatio = value;
  markDirty(true, false);
}
function setTheme(value: string | null) {
  if (!value || !themeOptions.some((option) => option.value === value)) return;
  currentConfig.value.pageLayout.themeId = value;
  markDirty(true, false);
}
function setBottomNavEnabled(value: boolean) {
  if (activePlatform.value === 'desktop') return;
  const config = currentConfig.value;
  config.pageLayout.bottomNavEnabled = true;
  const existing = config.modules.find((module) => module.type === 'bottomNav');
  if (!existing && config.templateId) {
    insertModuleByZone(createModule(bottomNavDescriptor(config.templateId), config.templateId));
  }
  markDirty(true, false);
}
function setAuthState(value: AuthState) {
  currentConfig.value.pageLayout.authState = value;
  markDirty(true, false);
}
function toggleAuthState(value: boolean) {
  setAuthState(value ? 'loggedIn' : 'loggedOut');
}
function setSideNavEnabled(value: boolean) {
  if (activePlatform.value !== 'desktop') return;
  const existing = currentConfig.value.modules.filter((module) => module.variant === 'sideNav');
  if (value && !existing.length) {
    const sideNav = createModule(descriptor('function', 'sideNav', 'PC 側邊導航', '固定入口／搜尋與分類導航', 'content', 'sideNav', false, 'topNav'));
    sideNav.sourceTemplateId = currentConfig.value.templateId;
    sideNav.isCustomModule = true;
    const topNavIndex = currentConfig.value.modules.findIndex((module) => module.type === 'topNav');
    currentConfig.value.modules.splice(topNavIndex >= 0 ? topNavIndex + 1 : 0, 0, sideNav);
  } else if (!value && existing.length) {
    currentConfig.value.modules = currentConfig.value.modules.filter((module) => module.variant !== 'sideNav');
  }
  currentConfig.value.pageLayout.sideNavEnabled = value;
  markDirty(true, false);
}
function setRtpEnabled(value: boolean) {
  if (!currentModule.value || currentModule.value.type !== 'games') return;
  currentModule.value.rtpEnabled = value;
  markDirty();
}
function setCustomDisplayRows(value: number | null) {
  if (!currentModule.value || currentModule.value.variant !== 'customDisplay') return;
  currentModule.value.customDisplayRows = value || 2;
  ensureCustomDisplayConfig(currentModule.value);
  markDirty();
}
function setCustomDisplayColumns(value: number | null) {
  if (!currentModule.value || currentModule.value.variant !== 'customDisplay') return;
  currentModule.value.customDisplayColumns = value || 3;
  ensureCustomDisplayConfig(currentModule.value);
  markDirty();
}
function handleCustomDisplayImage(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const module = currentModule.value;
  if (!module || module.variant !== 'customDisplay' || !file) return;
  ensureCustomDisplayConfig(module);
  const slot = module.customDisplaySlots?.[index];
  if (!slot) return;
  slot.imageName = file.name;
  slot.imageSource = URL.createObjectURL(file);
  markDirty();
}
function moveModule(id: string, offset: number) {
  const modules = currentConfig.value.modules;
  const index = modules.findIndex((module) => module.id === id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= modules.length) return;
  const [module] = modules.splice(index, 1);
  modules.splice(target, 0, module);
  markDirty();
}
function removeModule(id: string) {
  const index = currentConfig.value.modules.findIndex((module) => module.id === id);
  if (index < 0) return;
  if (activePlatform.value !== 'desktop' && currentConfig.value.modules[index].type === 'bottomNav') {
    message.info('H5／APP 底部導航固定存在，請到素材設定調整入口。');
    return;
  }
  currentConfig.value.modules.splice(index, 1);
  selectedModuleId.value = currentConfig.value.modules[0]?.id || '';
  markDirty(true, false);
  inspectorTab.value = 'library';
  message.info('模組已移除，可從模組庫重新加入。');
}
function copyConfiguration() {
  if (copySource.value === activePlatform.value) {
    message.info('來源與目前終端相同。');
    return;
  }
  const source = configs[copySource.value];
  const sourceModules = activePlatform.value === 'desktop'
    ? source.modules
    : source.modules.filter((module) => module.variant !== 'sideNav');
  const conflicts = sourceModules.map((module) => ({ source: module, current: currentConfig.value.modules.find((item) => item.slot === module.slot && item.type === module.type), })).filter((item): item is { source: ModuleConfig; current: ModuleConfig } => Boolean(item.current));
  pendingCopyModules.value = sourceModules;
  copyConflicts.splice(0, copyConflicts.length, ...conflicts.map((item) => ({ ...item, targetId: item.current.id, choice: 'current' as const })));
  if (!copyConflicts.length) {
    applyCopyResult();
    return;
  }
  copyDialogVisible.value = true;
}
function applyCopyResult() {
  const conflictByTarget = new Map(copyConflicts.map((item) => [item.targetId, item]));
  pendingCopyModules.value.forEach((sourceModule) => {
    const current = currentConfig.value.modules.find((module) => module.slot === sourceModule.slot && module.type === sourceModule.type);
    if (!current) {
      insertModuleByZone({ ...sourceModule, id: nextId(), sourceTemplateId: currentConfig.value.templateId, isCustomModule: true });
      return;
    }
    const conflict = conflictByTarget.get(current.id);
    if (conflict?.choice === 'source') Object.assign(current, { ...sourceModule, id: current.id, sourceTemplateId: currentConfig.value.templateId, isCustomModule: true });
  });
  copyDialogVisible.value = false;
  markDirty();
  message.success(`${platformMeta[copySource.value].label} 已合併至${currentPlatform.value.label}草稿。`);
}
function persistDraftSnapshot() {
  const versionHistoryByPlatform = {
    desktop: versionHistoryByPlatformRef('desktop'),
    mobile: versionHistoryByPlatformRef('mobile'),
    app: versionHistoryByPlatformRef('app'),
  };
  if (isSharedEditFlow && sharedLayoutId) {
    const platform = activePlatform.value;
    setStoredSharedLayout(sharedLayoutId, platform, {
      layoutId: sharedLayoutId,
      platform,
      templateId: configs[platform].templateId,
      config: cloneHomeConfig(configs[platform]),
      version: versions[platform],
      status: statusByPlatform[platform],
      previewed: previewed[platform],
      lastModifiedAt: lastModifiedByPlatform[platform],
      versionHistory: versionHistoryByPlatform[platform],
    } satisfies SharedLayoutStoredSnapshot);
    return;
  }
  setStoredDraftPayload(tenantId, {
    configs: {
      desktop: cloneHomeConfig(configs.desktop),
      mobile: cloneHomeConfig(configs.mobile),
      app: cloneHomeConfig(configs.app),
    },
    versions: { ...versions },
    statusByPlatform: { ...statusByPlatform },
    previewed: { ...previewed },
    lastModifiedByPlatform: { ...lastModifiedByPlatform },
    versionHistoryByPlatform,
    preserveVersionOnSave: { ...preserveVersionOnSave },
    batchHandoff: storedDraft?.batchHandoff,
  });
  setStoredDraft(tenantId, platformKeys.some((platform) => statusByPlatform[platform] !== '已發布'));
}
function versionHistoryByPlatformRef(platform: Platform) {
  return versionHistoryByPlatform[platform].map((record) => ({
    ...record,
    retryHistory: [...(record.retryHistory || [])],
    systemReportRecipients: record.systemReportRecipients ? [...record.systemReportRecipients] : undefined,
    config: record.config ? cloneHomeConfig(record.config) : undefined,
  }));
}
function syncSharedLayoutAfterPublish(platform: Platform) {
  if (!isSharedEditFlow || !sharedLayoutId) return 0;
  const references = getSharedLayoutReferences(sharedLayoutId, platform);
  setStoredSharedLayout(sharedLayoutId, platform, {
    layoutId: sharedLayoutId,
    platform,
    templateId: configs[platform].templateId,
    config: cloneHomeConfig(configs[platform]),
    version: versions[platform],
    status: '已發布',
    previewed: true,
    lastModifiedAt: lastModifiedByPlatform[platform],
    versionHistory: versionHistoryByPlatformRef(platform),
  } satisfies SharedLayoutStoredSnapshot);
  return references.length;
}
function saveDraft() {
  const platform = activePlatform.value;
  if (!dirtyByPlatform[platform]) {
    message.info('目前終端沒有未保存變更。');
    return;
  }
  const preserveVersion = preserveVersionOnSave[platform];
  if (!preserveVersion) versions[platform] += 1;
  preserveVersionOnSave[platform] = false;
  const timestamp = nowText();
  lastModifiedByPlatform[platform] = timestamp;
  statusByPlatform[platform] = '草稿';
  const record = preserveVersion ? ensureCurrentRecord(platform) : createVersionRecord(platform, versions[platform], '草稿', timestamp);
  if (!preserveVersion) versionHistoryByPlatform[platform].push(record);
  Object.assign(record, {
    status: '草稿' as Status,
    lastModifiedAt: timestamp,
    modifiedBy: '原型使用者',
    submittedAt: undefined,
    approvedAt: undefined,
    publishedAt: undefined,
    actualPublishedAt: undefined,
    scheduledAt: undefined,
    failureAt: undefined,
    failureReason: undefined,
    retryCount: 0,
    retryHistory: [],
    systemReportedAt: undefined,
    systemReportRecipients: undefined,
    rejectionReason: undefined,
    rollbackTargetVersion: undefined,
  });
  record.config = cloneHomeConfig(configs[platform]);
  snapshotSavedPlatform(platform);
  persistDraftSnapshot();
  dirtyByPlatform[platform] = false;
  message.success(currentPlatform.value.label + '草稿已保存，版本號 ' + platformMeta[platform].short + '-D' + String(versions[platform]).padStart(2, '0') + '。');
}
function submitApproval() {
  if (!canSubmit.value) {
    message.warning('請完成目前終端的必要配置並成功預覽。');
    return;
  }
  const platform = activePlatform.value;
  const timestamp = nowText();
  statusByPlatform[platform] = '待審批';
  dirtyByPlatform[platform] = false;
  snapshotSavedPlatform(platform);
  updateCurrentRecord(platform, {
    status: '待審批',
    submittedAt: timestamp,
    modifiedBy: '原型使用者',
    rejectionReason: undefined,
    approvalRuleSnapshot: '送審時規則快照',
  });
  persistDraftSnapshot();
  message.success(currentPlatform.value.label + '已送出審批，未直接發布。');
}
function approveVersion() {
  const platform = activePlatform.value;
  if (statusByPlatform[platform] !== '待審批') return;
  if (!previewed[platform]) {
    message.warning('審批前需完成目前終端預覽。');
    return;
  }
  const timestamp = nowText();
  statusByPlatform[platform] = '已審批';
  snapshotSavedPlatform(platform);
  updateCurrentRecord(platform, { status: '已審批', approvedAt: timestamp, modifiedBy: '原型審批人' });
  persistDraftSnapshot();
  message.success(currentPlatform.value.label + '已審批通過，可立即發布或排程發布。');
}
function openRejectModal() {
  if (currentStatus.value !== '待審批') return;
  rejectReason.value = '';
  rejectModalVisible.value = true;
}
function rejectVersion() {
  const reason = rejectReason.value.trim();
  if (!reason) return;
  const platform = activePlatform.value;
  const previous = sortedVersionHistory(platform).find((record) => record.status === '已發布' && record.version !== versions[platform] && record.config);
  if (previous?.config) configs[platform] = cloneHomeConfig(previous.config);
  statusByPlatform[platform] = '草稿';
  preserveVersionOnSave[platform] = true;
  dirtyByPlatform[platform] = true;
  previewed[platform] = false;
  selectedModuleId.value = configs[platform].modules[0]?.id || '';
  updateCurrentRecord(platform, {
    status: '草稿',
    rejectionReason: reason,
    modifiedBy: '原型審批人',
    submittedAt: undefined,
    approvedAt: undefined,
  });
  rejectModalVisible.value = false;
  persistDraftSnapshot();
  message.success(previous?.config ? '已退回並回到前一已發布版本；版本號不變。' : '已退回；目前沒有已發布快照，版本號不變。');
}
function publishFailureMode() {
  const mode = String(route.query.publishFailure || '');
  return mode === 'once' || mode === 'always' ? mode : '';
}
function shouldSimulatePublishFailure(platform: Platform) {
  const mode = publishFailureMode();
  if (mode === 'always') return true;
  if (mode === 'once') return (currentRecordFor(platform)?.retryCount || 0) === 0;
  return false;
}
function markPublishFailed(platform: Platform, timestamp: string, reason = '前台發布服務未回應') {
  statusByPlatform[platform] = '發布失敗';
  const stablePublished = sortedVersionHistory(platform).find((record) => record.status === '已發布' && record.version !== versions[platform]);
  updateCurrentRecord(platform, {
    status: '發布失敗',
    actualPublishedAt: undefined,
    publishedAt: undefined,
    failureAt: timestamp,
    failureReason: reason,
    modifiedBy: '原型發布人',
    frontendState: '維持前一版本',
    stablePublishedVersion: stablePublished?.version,
  });
  dirtyByPlatform[platform] = false;
  snapshotSavedPlatform(platform);
  persistDraftSnapshot();
}
function publishImmediately() {
  const platform = activePlatform.value;
  if (statusByPlatform[platform] !== '已審批') return;
  const timestamp = nowText();
  if (shouldSimulatePublishFailure(platform)) {
    markPublishFailed(platform, timestamp);
    message.error(currentPlatform.value.label + '發布失敗，可持續重試或回報系統。');
    return;
  }
  statusByPlatform[platform] = '已發布';
  updateCurrentRecord(platform, {
    status: '已發布',
    publishedAt: timestamp,
    actualPublishedAt: timestamp,
    failureAt: undefined,
    failureReason: undefined,
    systemReportedAt: undefined,
    systemReportRecipients: undefined,
    modifiedBy: '原型發布人',
    rollbackTargetVersion: undefined,
    frontendState: '已切換至本版本',
    stablePublishedVersion: versions[platform],
  });
  snapshotSavedPlatform(platform);
  dirtyByPlatform[platform] = false;
  persistDraftSnapshot();
  const syncedReferences = syncSharedLayoutAfterPublish(platform);
  message.success(syncedReferences ? `${currentPlatform.value.label}已發布，已同步 ${syncedReferences} 個引用商戶。` : currentPlatform.value.label + '已立即發布。');
}
function retryPublish() {
  const platform = activePlatform.value;
  if (statusByPlatform[platform] !== '發布失敗') return;
  const record = ensureCurrentRecord(platform);
  const timestamp = nowText();
  const retryCount = (record.retryCount || 0) + 1;
  record.retryCount = retryCount;
  record.retryHistory = [...(record.retryHistory || []), `第${retryCount}次重試 ${timestamp}`];
  record.systemReportedAt = undefined;
  record.systemReportRecipients = undefined;
  if (shouldSimulatePublishFailure(platform)) {
    markPublishFailed(platform, timestamp);
    message.error(currentPlatform.value.label + '重試仍失敗，可繼續重試或回報系統。');
    return;
  }
  statusByPlatform[platform] = '已發布';
  updateCurrentRecord(platform, {
    status: '已發布',
    publishedAt: timestamp,
    actualPublishedAt: timestamp,
    failureAt: undefined,
    failureReason: undefined,
    modifiedBy: '原型發布人',
    rollbackTargetVersion: undefined,
    frontendState: '已切換至本版本',
    stablePublishedVersion: versions[platform],
  });
  snapshotSavedPlatform(platform);
  dirtyByPlatform[platform] = false;
  persistDraftSnapshot();
  const syncedReferences = syncSharedLayoutAfterPublish(platform);
  message.success(syncedReferences ? `${currentPlatform.value.label}重試發布成功，已同步 ${syncedReferences} 個引用商戶。` : currentPlatform.value.label + '重試發布成功。');
}
function reportPublishFailure() {
  const platform = activePlatform.value;
  if (statusByPlatform[platform] !== '發布失敗') return;
  const timestamp = nowText();
  const recipients = ['系統管理人', '商戶管理者'];
  const record = ensureCurrentRecord(platform);
  updateCurrentRecord(platform, {
    status: '發布失敗',
    systemReportedAt: timestamp,
    systemReportRecipients: recipients,
    retryHistory: [...(record.retryHistory || []), `回報系統 ${timestamp}`],
    modifiedBy: '原型使用者',
  });
  persistDraftSnapshot();
  message.success('已回報系統，通知系統管理人與商戶管理者。');
}
function openScheduleModal() {
  if (currentStatus.value !== '已審批') return;
  scheduleAt.value = '';
  scheduleModalVisible.value = true;
}
function schedulePublish() {
  const platform = activePlatform.value;
  const value = scheduleAt.value.trim();
  const parsed = new Date(value.replace(' ', 'T'));
  if (!value || Number.isNaN(parsed.getTime())) {
    message.warning('請使用 YYYY-MM-DD HH:mm 格式。');
    return;
  }
  if (parsed.getTime() <= Date.now()) {
    message.warning('排程時間必須晚於現在。');
    return;
  }
  const conflict = platformKeys.some((key) =>
    versionHistoryByPlatform[key].some((record) => record.status === '排程中' && record.scheduledAt === value),
  );
  if (conflict) {
    message.error('同一商戶已有相同發布時間的排程，請修改時間。');
    return;
  }
  const timestamp = nowText();
  statusByPlatform[platform] = '排程中';
  snapshotSavedPlatform(platform);
  updateCurrentRecord(platform, {
    status: '排程中',
    scheduledAt: value,
    modifiedBy: '原型發布人',
    scheduleHistory: [...(currentRecordFor(platform)?.scheduleHistory || []), timestamp + ' 建立排程'],
  });
  scheduleModalVisible.value = false;
  persistDraftSnapshot();
  message.success(currentPlatform.value.label + '已排程發布（商戶時區）。');
}
function cancelScheduledPublish() {
  const platform = activePlatform.value;
  const record = ensureCurrentRecord(platform);
  if (record.status !== '排程中') return;
  const timestamp = nowText();
  statusByPlatform[platform] = '已審批';
  snapshotSavedPlatform(platform);
  Object.assign(record, {
    status: '已審批' as Status,
    scheduledAt: undefined,
    modifiedBy: '原型審批人',
    scheduleHistory: [...(record.scheduleHistory || []), timestamp + ' 取消排程'],
  });
  persistDraftSnapshot();
  message.success('排程已取消，原審批結果保留。');
}
function requestRollback(platformValue: Platform | string, targetVersion: number) {
  const platform = platformValue as Platform;
  const target = versionHistoryByPlatform[platform].find((record) => record.version === targetVersion && record.status === '已發布');
  if (!target?.config || !isRollbackAvailable(platform, target)) {
    message.warning('目前原型缺少該版本配置快照，暫無法執行回滾。');
    return;
  }
  configs[platform] = cloneHomeConfig(target.config);
  selectedModuleId.value = configs[platform].modules[0]?.id || '';
  statusByPlatform[platform] = '待審批';
  previewed[platform] = false;
  dirtyByPlatform[platform] = false;
  snapshotSavedPlatform(platform);
  updateCurrentRecord(platform, {
    status: '待審批',
    rollbackTargetVersion: targetVersion,
    submittedAt: nowText(),
    approvedAt: undefined,
    publishedAt: undefined,
    scheduledAt: undefined,
    modifiedBy: '原型申請人',
  });
  versionsVisible.value = false;
  persistDraftSnapshot();
  message.success(platformMeta[platform].label + '已建立回滾申請，沿用版本號並等待重新審批。');
}
function previewRenderReady(platform: Platform) {
  const config = configs[platform];
  const visibleModules = config.modules.filter((module) => (
    (module.type !== 'bottomNav' || platform === 'desktop')
    && (module.type !== 'floating' || Boolean(module.floatingPageKeys?.length))
  ));
  const content = previewDeviceRef.value?.querySelector('.fc-preview-content');
  const renderedModules = content?.querySelectorAll(':scope > .fc-preview-module').length || 0;
  const fixedBottomReady = platform === 'desktop'
    || !config.modules.some((module) => module.type === 'bottomNav')
    || Boolean(previewDeviceRef.value?.querySelector('.fc-preview-fixed-bottom .fc-wireframe'));
  return Boolean(config.templateId && visibleModules.length && content && renderedModules === visibleModules.length && fixedBottomReady);
}
async function openPreview(platform: Platform = activePlatform.value) {
  if (!configs[platform].templateId || !configs[platform].modules.length) {
    message.warning('請先選擇模板並載入首頁模組。');
    return;
  }
  previewPlatform.value = platform;
  previewed[platform] = false;
  previewVisible.value = true;
  await nextTick();
  if (!previewRenderReady(platform)) {
    previewVisible.value = false;
    message.error('目前終端預覽未完成渲染，無法標記為成功。');
    return;
  }
  previewed[platform] = true;
  refreshPreviewScale();
}
function resetConfiguration() {
  dialog.warning({
    title: '還原目前終端',
    content: '將目前終端恢復為初始空白狀態，未保存變更會被捨棄。',
    positiveText: '還原',
    negativeText: '取消',
    onPositiveClick: () => {
      configs[activePlatform.value] = createConfig('', activePlatform.value);
      configs[activePlatform.value].isCustomTemplate = false;
      selectedModuleId.value = '';
      previewed[activePlatform.value] = false;
      markDirty();
      message.success('目前終端已還原為空白配置。');
    },
  });
}
function setFloatingIconFunction(key: string) {
  const module = currentModule.value;
  if (!module || module.type !== 'floating' || !floatingIconLibrary[key]) return;
  module.floatingIconFunction = key;
  module.floatingIconKey = key;
  module.floatingIconName = '';
  module.floatingIconSource = '';
  markDirty();
}
function ensureFloatingPageConfig(module: ModuleConfig) {
  if (module.type !== 'floating') return;
  if (!module.floatingPageKeys) module.floatingPageKeys = [...allFloatingPageKeys];
}
function isFloatingPageSelected(key: string) {
  const module = currentModule.value;
  if (!module || module.type !== 'floating') return false;
  ensureFloatingPageConfig(module);
  return module.floatingPageKeys?.includes(key) || false;
}
function selectedFloatingPageCount(group: FloatingPageGroup) {
  const module = currentModule.value;
  if (!module || module.type !== 'floating') return 0;
  ensureFloatingPageConfig(module);
  return group.pages.filter((page) => module.floatingPageKeys?.includes(page.key)).length;
}
function setFloatingPage(key: string, event: Event) {
  const module = currentModule.value;
  if (!module || module.type !== 'floating') return;
  ensureFloatingPageConfig(module);
  const checked = (event.target as HTMLInputElement).checked;
  const keys = new Set(module.floatingPageKeys || []);
  if (checked) keys.add(key);
  else keys.delete(key);
  module.floatingPageKeys = [...keys];
  markDirty();
}
function handleLogoChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (currentModule.value?.type !== 'topNav') return;
  const file = input.files?.[0];
  currentModule.value.logoName = file?.name || '尚未上傳 LOGO';
  currentModule.value.logoSource = file ? URL.createObjectURL(file) : '';
  markDirty();
}
function handleGameSubcategoryIconUpload(event: Event, venueId: string, subcategoryId: string) {
  const input = event.target as HTMLInputElement;
  const target = findGameSubcategory(venueId, subcategoryId);
  const file = input.files?.[0];
  if (!target || !file) return;
  target.subcategory.iconName = file.name;
  target.subcategory.iconSource = URL.createObjectURL(file);
  target.subcategory.iconKey = target.subcategory.iconKey || 'games-outline';
  markDirty(true, false);
  message.success('已上傳遊戲分類圖標');
}
function handleTopNavIconChange(event: Event, key: string) {
  const input = event.target as HTMLInputElement;
  const bottomTarget = parseBottomNavIconTarget(key);
  if (bottomTarget && currentModule.value?.type === 'bottomNav') {
    const file = input.files?.[0];
    const items = (currentModule.value.bottomNavItems || []).map((item) => item.key === bottomTarget.entryKey ? {
      ...item,
      [`${bottomTarget.state}IconName`]: file?.name || '',
      [`${bottomTarget.state}IconSource`]: file ? URL.createObjectURL(file) : '',
    } : item);
    currentModule.value.bottomNavItems = items;
    iconLibraryVisible.value = false;
    markDirty();
    message.success(`已上傳${bottomTarget.state === 'active' ? '啟用' : '未啟用'}圖標`);
    return;
  }
  const gameTarget = parseGameIconTarget(key);
  if (gameTarget) {
    const target = findGameSubcategory(gameTarget.venueId, gameTarget.subcategoryId);
    const file = input.files?.[0];
    if (!target || !file) return;
    target.subcategory.iconName = file.name;
    target.subcategory.iconSource = URL.createObjectURL(file);
    target.subcategory.iconKey = target.subcategory.iconKey || 'games-outline';
    iconLibraryVisible.value = false;
    markDirty(true, false);
    message.success('已上傳遊戲分類圖標');
    return;
  }
  if (currentModule.value?.type === 'floating' && key === 'floating') {
    const file = input.files?.[0];
    currentModule.value.floatingIconName = file?.name || '';
    currentModule.value.floatingIconSource = file ? URL.createObjectURL(file) : '';
    iconLibraryVisible.value = false;
    markDirty();
    message.success('已上傳浮標圖標');
    return;
  }
  if (currentModule.value?.type === 'notice' && key === 'notice') {
    const file = input.files?.[0];
    currentModule.value.noticeIconName = file?.name || '';
    currentModule.value.noticeIconSource = file ? URL.createObjectURL(file) : '';
    currentModule.value.noticeIconKey = 'notice';
    iconLibraryVisible.value = false;
    markDirty();
    message.success('已上傳跑馬燈圖標');
    return;
  }
  if (currentModule.value?.type !== 'topNav') return;
  const file = input.files?.[0];
  currentModule.value.buttonIconNames = {
    ...(currentModule.value.buttonIconNames || {}),
    [key]: file?.name || '使用預設圖標',
  };
  currentModule.value.buttonIconSources = {
    ...(currentModule.value.buttonIconSources || {}),
    [key]: file ? URL.createObjectURL(file) : '',
  };
  if (file) {
    currentModule.value.buttonIconKeys = {
      ...(currentModule.value.buttonIconKeys || {}),
      [key]: key,
    };
    iconLibraryVisible.value = false;
    message.success(`已上傳${topNavButtonCatalog.find((item) => item.key === key)?.label || ''}圖標`);
  }
  markDirty();
}
function openIconLibrary(key: string) {
  if (parseGameIconTarget(key)) {
    iconLibraryTarget.value = key;
    iconLibraryVisible.value = true;
    return;
  }
  if (!['topNav', 'bottomNav', 'floating', 'notice'].includes(currentModule.value?.type || '')) return;
  iconLibraryTarget.value = key;
  iconLibraryVisible.value = true;
}
function selectIconFromLibrary(iconKey: string) {
  const module = currentModule.value;
  const targetKey = iconLibraryTarget.value;
  const bottomTarget = parseBottomNavIconTarget(targetKey);
  const gameTarget = parseGameIconTarget(targetKey);
  if (gameTarget) {
    const target = findGameSubcategory(gameTarget.venueId, gameTarget.subcategoryId);
    if (!target) return;
    target.subcategory.iconKey = iconKey;
    target.subcategory.iconName = '';
    target.subcategory.iconSource = '';
    iconLibraryVisible.value = false;
    markDirty(true, false);
    message.success(`已套用${gameIconLabel(iconKey)}圖標`);
    return;
  }
  if (module?.type === 'bottomNav' && bottomTarget) {
    module.bottomNavItems = (module.bottomNavItems || []).map((item) => item.key === bottomTarget.entryKey ? {
      ...item,
      [`${bottomTarget.state}IconKey`]: iconKey,
      [`${bottomTarget.state}IconName`]: '',
      [`${bottomTarget.state}IconSource`]: '',
    } : item);
    iconLibraryVisible.value = false;
    markDirty();
    message.success(`已套用${bottomTarget.state === 'active' ? '啟用' : '未啟用'}圖標`);
    return;
  }
  if (module?.type === 'floating' && targetKey === 'floating') {
    module.floatingIconKey = iconKey;
    module.floatingIconName = '';
    module.floatingIconSource = '';
    iconLibraryVisible.value = false;
    markDirty();
    message.success(`已套用${getTopNavIconOption(iconKey)?.label || '圖標庫'}圖標`);
    return;
  }
  if (module?.type === 'notice' && targetKey === 'notice') {
    module.noticeIconKey = iconKey;
    module.noticeIconName = '';
    module.noticeIconSource = '';
    iconLibraryVisible.value = false;
    markDirty();
    message.success(`已套用${noticeIconLabel(iconKey)}圖標`);
    return;
  }
  if (!module || module.type !== 'topNav' || !targetKey) return;
  module.buttonIconKeys = { ...(module.buttonIconKeys || {}), [targetKey]: iconKey };
  module.buttonIconNames = { ...(module.buttonIconNames || {}), [targetKey]: '' };
  module.buttonIconSources = { ...(module.buttonIconSources || {}), [targetKey]: '' };
  iconLibraryVisible.value = false;
  markDirty();
  message.success(`已套用${getTopNavIconOption(iconKey)?.label || '圖標庫'}圖標`);
}
function getTopNavIconOption(key: string) {
  return [...Object.values(topNavIconLibrary), ...Object.values(bottomNavIconLibrary), ...Object.values(floatingIconLibrary), noticeIconLibrary, gameEntryIconLibrary].flat().find((item) => item.key === key);
}
function gameIconLabel(key: string) {
  return gameEntryIconLibrary.find((item) => item.key === key)?.label || '預設遊戲';
}
function noticeIconPreview(key: string) {
  return noticeIconLibrary.find((item) => item.key === key)?.icon || NotificationsOutline;
}
function noticeIconLabel(key: string) {
  return noticeIconLibrary.find((item) => item.key === key)?.label || '預設公告';
}
function topNavButtonIcon(key: string) {
  const iconKey = currentModule.value?.type === 'topNav' ? currentModule.value.buttonIconKeys?.[key] || key : key;
  return getTopNavIconOption(iconKey)?.icon || topNavButtonCatalog.find((item) => item.key === key)?.icon || NotificationsOutline;
}
function topNavIconLabel(key: string) {
  const iconKey = currentModule.value?.type === 'topNav' ? currentModule.value.buttonIconKeys?.[key] || key : key;
  return getTopNavIconOption(iconKey)?.label || '系統預設圖標';
}
function bottomNavIconLabel(entryKey: string, state: 'active' | 'inactive') {
  const key = `${entryKey}-${state === 'active' ? 'filled' : 'outline'}`;
  return getTopNavIconOption(key)?.label || '系統預設圖標';
}
function moveBottomNavEntry(key: string, direction: -1 | 1) {
  const module = currentModule.value;
  if (!module || module.type !== 'bottomNav') return;
  const items = [...(module.bottomNavItems || [])];
  const index = items.findIndex((item) => item.key === key);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
  module.bottomNavItems = items;
  markDirty();
}
function addTopNavButton(key: string) {
  const module = currentModule.value;
  if (!module || module.type !== 'topNav') return;
  module.buttonKeys = [...(module.buttonKeys || []), key];
  markDirty();
}
function removeTopNavButton(key: string) {
  const module = currentModule.value;
  if (!module || module.type !== 'topNav') return;
  module.buttonKeys = (module.buttonKeys || []).filter((item) => item !== key);
  markDirty();
}
function goBack() {
  const dirtyPlatforms = platformKeys.filter((platform) => dirtyByPlatform[platform]);
  if (!dirtyPlatforms.length) {
    router.push({ name: 'config_layoutConfig' });
    return;
  }
  dialog.warning({
    title: '有未保存變更',
    content: `目前有${dirtyPlatforms.map((platform) => platformMeta[platform].label).join('、')}未保存變更。離開前要保存草稿、捨棄本次變更，或關閉提示繼續編輯？`,
    positiveText: '保存草稿',
    negativeText: '捨棄變更',
    onPositiveClick: () => {
      const current = activePlatform.value;
      dirtyPlatforms.forEach((platform) => {
        activePlatform.value = platform;
        saveDraft();
      });
      activePlatform.value = current;
      router.push({ name: 'config_layoutConfig' });
    },
    onNegativeClick: () => {
      dirtyPlatforms.forEach((platform) => {
        activePlatform.value = platform;
        discardCurrentPlatformChanges();
      });
      inspectorTab.value = 'library';
      router.push({ name: 'config_layoutConfig' });
    },
  });
}
</script>
