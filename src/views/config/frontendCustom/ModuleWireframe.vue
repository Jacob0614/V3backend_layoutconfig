<template>
  <div
    class="fc-wireframe"
    :class="[
      `fc-wireframe--${module.type}`,
      `fc-wireframe--${module.variant}`,
      `fc-wireframe--${props.fidelity || 'low'}`,
      module.interaction ? `fc-wireframe--interaction-${module.interaction}` : '',
      module.type === 'category' ? `fc-wireframe--entry-${module.entryDisplayMode || 'iconText'}` : '',
      module.type === 'category' && module.iconVisible === false ? 'fc-wireframe--entry-no-icon' : '',
      templateId ? `fc-wireframe-template--${templateId}` : '',
    ]"
    :style="wireframeStyle"
  >
    <div v-if="module.type === 'games' && gameVenueGroups.length" class="fc-wire-game-venue-nav">
      <div class="fc-wire-game-venue-tabs">
        <span v-for="(venue, index) in gameVenueGroups" :key="venue.id" :class="{ active: index === 0 }">{{ venue.name }}</span>
      </div>
      <div class="fc-wire-game-sub-tabs">
        <span v-for="(section, index) in gameVenueGroups[0]?.subcategories || []" :key="section.id" :class="[gameSectionClass(section), { active: index === 0 }]">
          <img v-if="section.iconVisible && section.iconSource" :src="section.iconSource" alt="" />
          <i v-else-if="section.iconVisible" />
          <b>{{ section.name }}</b>
        </span>
      </div>
    </div>

    <div v-if="module.type === 'topNav' && /^(dualAuth|wideLogo|topnav0[1-7])$/.test(module.variant)" class="fc-wire-topnav-form" :class="[`fc-wire-topnav-form--${module.variant}`, { 'fc-wire-topnav-form--auth-bar': module.showAuthBar || module.variant === 'topnav04' }]" aria-label="頂部導航框架">
      <img
        v-if="module.referenceAsset && platform !== 'desktop' && fidelity !== 'low'"
        class="fc-wire-topnav-reference"
        :src="module.referenceAsset"
        alt=""
        aria-hidden="true"
      />
      <template v-else>
        <div class="fc-wire-topnav-form__row fc-wire-topnav-form__row--main">
          <i class="fc-wire-topnav-form__logo" />
          <span v-if="module.variant === 'topnav06'" class="fc-wire-topnav-form__middle"><i /><i /></span>
          <span class="fc-wire-topnav-form__actions">
            <i :class="{ 'fc-wire-topnav-form__button--solid': module.variant === 'dualAuth' ? module.primaryButton !== 'register' : module.variant !== 'topnav02' }" />
            <i :class="{ 'fc-wire-topnav-form__button--solid': module.variant === 'dualAuth' ? module.primaryButton === 'register' : module.variant === 'topnav02' }" />
          </span>
        </div>
        <div v-if="(module.variant === 'wideLogo' && module.showAuthBar) || module.variant === 'topnav04'" class="fc-wire-topnav-form__row fc-wire-topnav-form__row--sub">
          <i class="fc-wire-topnav-form__auth-button fc-wire-topnav-form__button--solid" /><i class="fc-wire-topnav-form__auth-button" />
        </div>
        <div v-if="module.variant === 'topnav05'" class="fc-wire-topnav-form__row fc-wire-topnav-form__row--split">
          <i /><i />
        </div>
        <div v-if="module.variant === 'topnav07'" class="fc-wire-topnav-form__row fc-wire-topnav-form__row--floating">
          <i /><i /><i /><i />
        </div>
      </template>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'redHome'" class="fc-wire-red-nav">
      <span v-if="!module.logoSource" class="fc-wire-red-nav-logo" aria-label="品牌標誌">LOGO</span>
      <img v-else class="fc-wire-red-nav-logo fc-wire-red-nav-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span class="fc-wire-red-nav-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" class="fc-wire-red-nav-icon" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'red92'" class="fc-wire-red92-nav">
      <img v-if="module.logoSource" class="fc-wire-red92-logo fc-wire-red92-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-red92-logo">LOGO</span>
      <span class="fc-wire-red92-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'public5WhiteGreen'" class="fc-wire-p5-nav">
      <img v-if="module.logoSource" class="fc-wire-p5-logo fc-wire-p5-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-p5-logo">LOGO</span>
      <span v-if="authState === 'loggedIn'" class="fc-wire-p5-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'public7'" class="fc-wire-p7-nav">
      <div v-if="authState === 'loggedIn'" class="fc-wire-p7-wallet"><span>0.00</span><b>＋</b></div>
      <img v-if="module.logoSource" class="fc-wire-p7-logo fc-wire-p7-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-p7-logo">LOGO</span>
      <span v-if="authState === 'loggedIn'" class="fc-wire-p7-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavActionButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
      <span v-else class="fc-wire-p7-auth"><b>Login</b><strong>Register</strong></span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'raja'" class="fc-wire-raja-nav">
      <img v-if="module.logoSource" class="fc-wire-raja-logo fc-wire-raja-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-raja-logo">LOGO</span>
      <span class="fc-wire-raja-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'blackGold'" class="fc-wire-black-gold-nav">
      <img v-if="module.logoSource" class="fc-wire-black-gold-logo fc-wire-black-gold-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-black-gold-logo">LOGO</span>
      <span class="fc-wire-black-gold-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'daman'" class="fc-wire-daman-nav">
      <img v-if="module.logoSource" class="fc-wire-daman-logo fc-wire-daman-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-daman-logo">LOGO</span>
      <span v-if="authState === 'loggedOut'" class="fc-wire-daman-auth"><b>登入</b><strong>註冊</strong></span>
      <span v-else class="fc-wire-daman-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'okwin'" class="fc-wire-okwin-nav">
      <img v-if="module.logoSource" class="fc-wire-okwin-logo fc-wire-okwin-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-okwin-logo">LOGO</span>
      <span v-if="authState === 'loggedIn'" class="fc-wire-okwin-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
      <span v-else class="fc-wire-okwin-auth"><b>登入</b><strong>註冊</strong></span>
    </div>

    <div v-else-if="module.type === 'topNav' && module.variant === 'goGame'" class="fc-wire-gogame-nav">
      <img v-if="module.logoSource" class="fc-wire-gogame-logo fc-wire-gogame-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-gogame-logo">LOGO</span>
      <span v-if="authState === 'loggedOut'" class="fc-wire-gogame-auth"><b>Register</b><i /><strong>Log in</strong></span>
      <span v-else class="fc-wire-gogame-member" aria-label="會員與錢包入口">
        <i />
        <span class="fc-wire-gogame-member-balance" />
        <b>Withdraw</b>
        <strong>Recharge</strong>
      </span>
    </div>

    <div v-else-if="module.type === 'screenBanner' && module.variant === 'public6DownloadBar'" class="fc-wire-public6-download">
      <div class="fc-wire-public6-download-main">
        <div class="fc-wire-public6-download-brand">
          <span class="fc-wire-public6-download-logo">LOGO</span>
          <span class="fc-wire-public6-download-copy">Download our APP and win<br /><strong>super prizes!</strong></span>
        </div>
        <div class="fc-wire-public6-download-art" aria-hidden="true"><i /><i /><i /></div>
        <div class="fc-wire-public6-download-actions">
          <span class="fc-wire-public6-download-install">install</span>
          <span class="fc-wire-public6-download-close">×</span>
        </div>
      </div>
      <div class="fc-wire-public6-hang" aria-label="品牌操作列">
        <span class="fc-wire-public6-hang-logo">LOGO</span>
        <span class="fc-wire-public6-hang-actions"><i /><i /></span>
      </div>
    </div>

    <div v-else-if="module.type === 'topNav' && templateId === 'public3Home'" class="fc-wire-public3-nav">
      <img v-if="module.logoSource" class="fc-wire-public3-logo fc-wire-public3-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-public3-logo">LOGO</span>
      <span class="fc-wire-public3-search"><Search /><i /></span>
      <span v-if="authState === 'loggedOut'" class="fc-wire-public3-auth"><b>登入</b><strong>註冊</strong></span>
      <span v-else class="fc-wire-public3-actions" aria-label="頂部操作入口">
        <span class="fc-wire-public3-wallet"><WalletOutline /><i /></span>
        <b>充值</b>
        <NotificationsOutline />
        <PersonOutline />
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && (module.variant === 'electronicNav' || module.variant === 'red096')" class="fc-wire-source-nav">
      <img v-if="module.logoSource" class="fc-wire-source-nav-logo fc-wire-source-nav-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-source-nav-logo">LOGO</span>
      <span class="fc-wire-source-nav-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && (module.variant === 'public5BlackGold' || module.variant === 'club')" class="fc-wire-source-auth-nav">
      <img v-if="module.logoSource" class="fc-wire-source-auth-nav-logo fc-wire-source-auth-nav-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-source-auth-nav-logo">LOGO</span>
      <span v-if="authState === 'loggedOut'" class="fc-wire-source-auth-nav-auth"><b>登入</b><strong>註冊</strong></span>
      <span v-else class="fc-wire-source-auth-nav-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav' && platform === 'desktop'" class="fc-wire-nav">
      <img v-if="module.logoSource" class="fc-wire-logo fc-wire-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-logo">LOGO</span>
      <span class="fc-wire-nav-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" class="fc-wire-nav-icon" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'topNav'" class="fc-wire-mobile-nav">
      <img v-if="module.logoSource" class="fc-wire-mobile-logo fc-wire-mobile-logo--image" :src="module.logoSource" alt="品牌標誌" />
      <span v-else class="fc-wire-mobile-logo">LOGO</span>
      <span class="fc-wire-mobile-nav-actions" aria-label="頂部操作入口">
        <template v-for="item in topNavButtons" :key="item.key">
          <img v-if="item.source" :src="item.source" :alt="item.label" />
          <component v-else :is="item.icon" :aria-label="item.label" />
        </template>
      </span>
    </div>

    <div v-else-if="module.type === 'banner'" class="fc-wire-banner fc-wire-banner--single" :class="`fc-wire-banner--${module.variant}`">
      <div class="fc-wire-image" />
      <div class="fc-wire-carousel-dots" aria-label="輪播位置"><i class="active" /><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'notice' && module.variant === 'bar'" class="fc-wire-notice fc-wire-notice--bar">
      <span class="fc-wire-speaker" aria-label="跑馬燈圖標">
        <img v-if="module.noticeIconSource" :src="module.noticeIconSource" alt="跑馬燈圖標" />
        <component v-else :is="noticeIcon" />
      </span>
      <span class="fc-wire-notice-copy"><i /><i /></span>
      <span class="fc-wire-notice-more">更多</span>
    </div>

    <div v-else-if="module.type === 'notice'" class="fc-wire-notice" :class="`fc-wire-notice--${module.variant}`">
      <span class="fc-wire-dot" />
      <span class="fc-wire-notice-copy"><i /><i /></span>
      <span class="fc-wire-notice-more">更多</span>
    </div>

    <div v-else-if="module.type === 'category'" class="fc-wire-category fc-wire-category--venue">
      <div class="fc-wire-venue-entry-list">
        <span v-for="venue in venueEntries" :key="venue.id">
          <i v-if="module.iconVisible !== false" />
          <b>{{ venue.name }}</b>
        </span>
      </div>
    </div>

    <div v-else-if="module.type === 'games' && gameVenueGroups.length" class="fc-wire-games fc-wire-games--venue">
      <div class="fc-wire-game-venue-section">
        <div class="fc-wire-section-title"><strong>{{ gameVenueGroups[0].name }}</strong><span /></div>
        <div v-for="section in gameVenueGroups[0].subcategories" :key="section.id" class="fc-wire-game-subsection">
          <div class="fc-wire-game-subsection-title" :class="gameSectionClass(section)">
              <i v-if="section.iconVisible" />
              <strong>{{ section.name }}</strong>
              <span />
          </div>
          <div class="fc-wire-game-grid">
            <span v-for="index in gameCardCount(section, cardCount)" :key="`${gameVenueGroups[0].id}-${section.id}-${index}`" class="fc-wire-game-card"><i /></span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'redHome'" class="fc-wire-games fc-wire-games--red-home">
      <div class="fc-wire-red-game-content">
        <div class="fc-wire-red-game-grid"><span v-for="index in 9" :key="`game-${index}`" class="fc-wire-game-card"><i /></span></div>
        <span class="fc-wire-red-game-more">查看全部</span>
      </div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'public6'" class="fc-wire-games fc-wire-games--public6">
      <div class="fc-wire-public6-content">
        <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
      </div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'blueHome'" class="fc-wire-games fc-wire-games--blue-home">
      <div class="fc-wire-blue-game-heading"><i /><span /></div>
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'blackGold'" class="fc-wire-games fc-wire-games--black-gold">
      <div class="fc-wire-black-gold-content"><div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'public3'" class="fc-wire-games fc-wire-games--public3">
      <div class="fc-wire-public3-sections"><div v-for="section in gameSections.slice(0, 2)" :key="section.id"><div class="fc-wire-public3-section-title" :class="gameSectionClass(section)"><i v-if="section.iconVisible" /><span>{{ section.name }}</span><b /></div><div class="fc-wire-game-grid"><span v-for="index in gameCardCount(section, 6)" :key="index" class="fc-wire-game-card"><i /></span></div></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'okwin'" class="fc-wire-games fc-wire-games--okwin">
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'public5BlackGold'" class="fc-wire-games fc-wire-games--public5-black-gold">
      <div class="fc-wire-public5-content"><div class="fc-wire-public5-title"><i /><span /></div><div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'club91'" class="fc-wire-games fc-wire-games--club91">
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'ar014'" class="fc-wire-games fc-wire-games--ar014">
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'raja'" class="fc-wire-games fc-wire-games--raja">
      <div class="fc-wire-raja-sections">
        <div v-for="section in gameSections.slice(0, 2)" :key="section.id" class="fc-wire-raja-section">
          <div class="fc-wire-section-title" :class="gameSectionClass(section)"><strong>{{ section.name }}</strong><span /></div>
          <div class="fc-wire-game-grid"><span v-for="index in gameCardCount(section, 6)" :key="`raja-${section.id}-${index}`" class="fc-wire-game-card"><i /><small /></span></div>
          <span class="fc-wire-raja-more">查看全部</span>
        </div>
      </div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'daman'" class="fc-wire-games fc-wire-games--daman">
      <div class="fc-wire-daman-sections"><div v-for="section in gameSections.slice(0, 2)" :key="section.id"><div class="fc-wire-daman-title" :class="gameSectionClass(section)"><i v-if="section.iconVisible" /><span>{{ section.name }}</span><b /></div><div class="fc-wire-game-grid"><span v-for="index in gameCardCount(section, 6)" :key="index" class="fc-wire-game-card"><i /></span></div></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'goGame'" class="fc-wire-games fc-wire-games--go-game">
      <div class="fc-wire-go-game-sections"><div v-for="section in gameSections.slice(0, 3)" :key="section.id"><div class="fc-wire-go-game-title" :class="gameSectionClass(section)"><i v-if="section.iconVisible" /><span>{{ section.name }}</span><b /></div><div class="fc-wire-game-grid"><span v-for="index in gameCardCount(section, 4)" :key="index" class="fc-wire-game-card"><i /></span></div></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'gameSection'" class="fc-wire-games fc-wire-games--game-section">
      <div v-for="section in gameSections.slice(0, 2)" :key="section.id" class="fc-wire-game-section-row"><div class="fc-wire-section-title" :class="gameSectionClass(section)"><strong>{{ section.name }}</strong><span /></div><div class="fc-wire-game-grid"><span v-for="index in gameCardCount(section, 6)" :key="index" class="fc-wire-game-card"><i /></span></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'recommended'" class="fc-wire-games fc-wire-games--recommended">
      <div class="fc-wire-section-title"><strong>推薦遊戲</strong><span /></div>
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'public5WhiteGreen'" class="fc-wire-games fc-wire-games--public5-white-green">
      <div class="fc-wire-game-section-row"><div class="fc-wire-section-title"><strong /><span /></div><div class="fc-wire-game-grid"><span v-for="index in 6" :key="index" class="fc-wire-game-card"><i /></span></div></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'electronic'" class="fc-wire-games fc-wire-games--electronic">
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'scene'" class="fc-wire-games fc-wire-games--scene">
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'container'" class="fc-wire-games fc-wire-games--container">
      <div class="fc-wire-section-title"><strong>{{ gameSections[0]?.name || '' }}</strong><span /></div>
      <div class="fc-wire-game-grid"><span v-for="index in gameCardCount(gameSections[0], cardCount)" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'red92'" class="fc-wire-games fc-wire-games--red92">
      <div class="fc-wire-game-grid"><span v-for="index in cardCount" :key="index" class="fc-wire-game-card"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'bigMumbai'" class="fc-wire-games fc-wire-games--big-mumbai">
      <div class="fc-wire-big-mumbai-title"><span /><b /></div>
      <div class="fc-wire-big-mumbai-grid"><span v-for="index in 6" :key="index"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'games' && module.variant === 'featured'" class="fc-wire-games fc-wire-games--featured">
      <div class="fc-wire-section-title"><strong>特色遊戲</strong><span>更多</span></div>
      <div class="fc-wire-featured"><i /></div>
    </div>

    <div v-else-if="module.type === 'games'" class="fc-wire-games">
      <div class="fc-wire-section-title">
        <strong>{{ gameSections[0]?.name || '' }}</strong>
        <span />
      </div>
      <div class="fc-wire-game-grid">
        <span v-for="index in gameCardCount(gameSections[0], cardCount)" :key="index" class="fc-wire-game-card">
          <i />
        </span>
      </div>
    </div>

    <div v-else-if="module.type === 'info' && module.variant === 'bigAward'" class="fc-wire-info fc-wire-info--big-award">
      <div class="fc-wire-section-title"><strong>大獎資訊</strong><span>查看大獎</span></div>
      <div class="fc-wire-award-grid"><span v-for="index in 3" :key="index"><i /></span></div>
    </div>

    <div v-else-if="module.type === 'info' && module.variant === 'person'" class="fc-wire-info fc-wire-info--person">
      <div class="fc-wire-person-avatar" />
      <div class="fc-wire-person-copy"><strong>會員資訊</strong></div>
      <div class="fc-wire-person-actions"><i /><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'info' && module.variant === 'winning'" class="fc-wire-info fc-wire-info--winning">
      <div class="fc-wire-section-title"><strong>中獎資訊</strong><span>Winning／Profit</span></div>
      <div class="fc-wire-data-list"><span v-for="index in 3" :key="index"><i /><small /></span></div>
    </div>

    <div v-else-if="module.type === 'info' && module.variant === 'instructions'" class="fc-wire-info fc-wire-info--instructions">
      <div class="fc-wire-section-title"><strong>遊戲說明</strong></div>
      <div class="fc-wire-lines"><i /><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'info' && module.variant === 'red92Winner'" class="fc-wire-info fc-wire-info--red92-winner">
      <div class="fc-wire-red92-info-title"><strong>中獎資訊</strong></div>
      <div class="fc-wire-red92-winner-list">
        <span v-for="index in 6" :key="index"><i /><b /><em /><small /></span>
      </div>
    </div>

    <div v-else-if="module.type === 'info' && module.variant === 'red92Rank'" class="fc-wire-info fc-wire-info--red92-rank">
      <div class="fc-wire-red92-info-title"><strong>排行資訊</strong></div>
      <div class="fc-wire-red92-rank-podium"><span /><span /><span /></div>
      <div class="fc-wire-red92-rank-list"><span v-for="index in 3" :key="index"><i /><b /><small /></span></div>
    </div>

    <div v-else-if="module.type === 'info'" class="fc-wire-info">
      <div class="fc-wire-section-title">
        <strong>{{ module.label }}</strong>
        <span>更多</span>
      </div>
      <div class="fc-wire-lines"><i v-for="index in 3" :key="index" /></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'loginCta'" class="fc-wire-function fc-wire-function--login">
      <div v-if="authState === 'loggedOut'" class="fc-wire-function-actions"><span>登入</span><span>註冊</span></div>
      <div v-else class="fc-wire-member-state"><i /><strong>會員中心</strong><span>0.00</span></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'loginTip'" class="fc-wire-function fc-wire-function--login-tip">
      <div v-if="authState === 'loggedOut'" class="fc-wire-login-tip-row"><i /><b>登入</b><b>註冊</b></div>
      <div v-else class="fc-wire-login-member-row"><i /><b>會員資訊</b><span>0.00</span></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'activityCards'" class="fc-wire-function fc-wire-function--activity">
      <div class="fc-wire-activity-grid">
        <span><i /><i class="fc-wire-card-line fc-wire-card-line--long" /><i class="fc-wire-card-line" /></span>
        <span><i /><i class="fc-wire-card-line fc-wire-card-line--long" /><i class="fc-wire-card-line" /></span>
      </div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'walletActions'" class="fc-wire-function fc-wire-function--wallet">
      <div class="fc-wire-wallet-balance"><span>錢包餘額</span><strong>0.00</strong></div>
      <div class="fc-wire-function-actions"><span>充值</span><span>提款</span><span>錢包</span></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'quickActions'" class="fc-wire-function fc-wire-function--quick">
      <div class="fc-wire-quick-grid"><span v-for="item in ['客服', '充值', '提款', 'VIP']" :key="item"><i />{{ item }}</span></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'social'" class="fc-wire-function fc-wire-function--social">
      <div class="fc-wire-social-list"><span v-for="item in ['Telegram', 'Facebook', 'Instagram']" :key="item"><i />{{ item }}</span></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'customDisplay'" class="fc-wire-function fc-wire-function--custom-display">
      <div class="fc-wire-custom-display-grid" :style="{ gridTemplateColumns: `repeat(${module.customDisplayColumns || 3}, minmax(0, 1fr))` }">
        <span v-for="(slot, index) in module.customDisplaySlots || []" :key="slot.id || index">
          <img v-if="slot.imageSource" :src="slot.imageSource" alt="自訂展示圖片" />
          <i v-else />
        </span>
      </div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'sideNav'" class="fc-wire-function fc-wire-function--side-nav">
      <div class="fc-wire-side-nav"><span v-for="item in ['首頁', '遊戲', '優惠', '會員']" :key="item" :class="{ active: item === '首頁' }">{{ item }}</span></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'settingsPanel'" class="fc-wire-function fc-wire-function--settings">
      <div class="fc-wire-setting-row"><i /><span>偏好設定</span><b>›</b></div>
      <div class="fc-wire-setting-row"><i /><span>客服與說明</span><b>›</b></div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'turntable'" class="fc-wire-function fc-wire-function--turntable">
      <div class="fc-wire-quick-icon">↻</div>
    </div>

    <div v-else-if="module.type === 'function' && module.variant === 'pwa'" class="fc-wire-function fc-wire-function--pwa">
      <div class="fc-wire-quick-icon">↓</div><strong>下載</strong>
    </div>

    <div v-else-if="module.type === 'function'" class="fc-wire-function">
      <div class="fc-wire-lines"><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'bottomNav'" class="fc-wire-bottom-nav" :class="bottomNavLayoutClass">
      <span v-for="(item, index) in bottomNavItems" :key="item.key" :class="{ 'fc-wire-bottom-nav-item--center': bottomNavLayout.center && index === bottomNavCenterIndex }">
        <b v-if="bottomNavLayout.center && index === bottomNavCenterIndex" class="fc-wire-bottom-nav-center-mark" aria-hidden="true" />
        <img v-if="index === 0 && item.activeIconSource" :src="item.activeIconSource" :alt="`${item.label}啟用圖標`" />
        <img v-else-if="index !== 0 && item.inactiveIconSource" :src="item.inactiveIconSource" :alt="`${item.label}未啟用圖標`" />
        <component v-else :is="bottomNavIcon(item, index === 0)" />
        {{ item.label }}
      </span>
    </div>

    <div v-else-if="module.type === 'footer' && module.variant === 'legal'" class="fc-wire-footer fc-wire-footer--legal">
      <strong>品牌資訊</strong>
      <div class="fc-wire-footer-lines"><i /><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'footer' && module.variant === 'team'" class="fc-wire-footer fc-wire-footer--team">
      <strong>Team</strong>
      <div class="fc-wire-footer-icons"><i v-for="index in 4" :key="index" /></div>
    </div>

    <div v-else-if="module.type === 'footer' && module.variant === 'terms'" class="fc-wire-footer fc-wire-footer--terms">
      <strong>條款與說明</strong>
      <div class="fc-wire-footer-lines"><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'footer' && module.variant === 'partner'" class="fc-wire-footer fc-wire-footer--partner">
      <strong>合作夥伴</strong>
      <div class="fc-wire-footer-icons"><i v-for="index in 5" :key="index" /></div>
    </div>

    <div v-else-if="module.type === 'footer' && module.variant === 'info'" class="fc-wire-footer fc-wire-footer--info">
      <div class="fc-wire-footer-lines"><i /><i /><i /></div>
      <div class="fc-wire-footer-icons"><i v-for="index in 3" :key="index" /></div>
    </div>

    <div v-else-if="module.type === 'footer'" class="fc-wire-footer">
      <div class="fc-wire-footer-lines"><i /><i /><i /></div>
    </div>

    <div v-else-if="module.type === 'floating'" class="fc-wire-floating">
      <img v-if="module.floatingIconSource" :src="module.floatingIconSource" alt="浮標圖標" />
      <i v-else :class="`fc-wire-floating-icon--${module.floatingIconKey || module.floatingIconFunction || 'rewardCenter'}`" />
    </div>

    <div v-else class="fc-wire-generic">
      <i /><i /><i />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
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

interface ModuleLike {
  type: string;
  variant: string;
  label: string;
  detail: string;
  referenceAsset?: string;
  sourceVariant?: string;
  interaction?: 'switch' | 'secondaryPage';
  ratio?: string;
  bannerCount?: number;
  bannerAlign?: 'left' | 'center' | 'right';
  buttonKeys?: string[];
  primaryButton?: 'login' | 'register';
  showAuthBar?: boolean;
  logoSource?: string;
  floatingIconSource?: string;
  floatingIconKey?: string;
  floatingIconFunction?: string;
  noticeIconSource?: string;
  noticeIconKey?: string;
  entryDisplayMode?: 'iconText' | 'icon' | 'text';
  iconVisible?: boolean;
  gameVenues?: Array<{
    id: string;
    name: string;
    subcategories: Array<{
      id: string;
      name: string;
      gameIds: string[];
      displayMode?: 'iconText' | 'icon' | 'text';
      iconVisible?: boolean;
      iconSource?: string;
      iconKey?: string;
    }>;
  }>;
  buttonIconSources?: Record<string, string>;
  buttonIconKeys?: Record<string, string>;
  bottomNavItems?: Array<{
    key: string;
    label: string;
    activeIconKey: string;
    inactiveIconKey: string;
    activeIconSource?: string;
    inactiveIconSource?: string;
  }>;
  customDisplayColumns?: number;
  customDisplaySlots?: Array<{ id: string; imageName: string; imageSource: string }>;
  templateId?: string;
}

const props = defineProps<{
  module: ModuleLike;
  platform: Platform;
  templateId?: string;
  authState?: AuthState;
  fidelity?: 'low' | 'high';
}>();

const templateId = computed(() => props.templateId || props.module.templateId || '');
const authState = computed<AuthState>(() => props.authState || 'loggedOut');
const noticeIconMap: Record<string, Component> = {
  notice: NotificationsOutline,
  'notice-filled': Notifications,
  'notice-circle': NotificationsCircleOutline,
  'notice-off': NotificationsOffOutline,
};
const noticeIcon = computed(() => noticeIconMap[props.module.noticeIconKey || 'notice'] || NotificationsOutline);
const wireframeStyle = computed(() => {
  if (props.module.type !== 'banner' || !props.module.ratio) return undefined;
  const style: Record<string, string> = { aspectRatio: props.module.ratio.replace(':', ' / ') };
  if (props.platform === 'desktop') {
    const bannerCount = Math.max(0.1, props.module.bannerCount || 1);
    style.width = `${Math.min(100, 100 / bannerCount)}%`;
    style.margin = props.module.bannerAlign === 'left' ? '0 auto 0 0' : props.module.bannerAlign === 'right' ? '0 0 0 auto' : '0 auto';
  }
  return style;
});

const topNavIcons: Record<string, { label: string; icon: Component }> = {
  notification: { label: '通知', icon: NotificationsOutline },
  'notification-filled': { label: '通知', icon: Notifications },
  'notification-circle': { label: '通知', icon: NotificationsCircleOutline },
  'notification-off': { label: '通知', icon: NotificationsOffOutline },
  download: { label: '下載', icon: DownloadOutline },
  'download-filled': { label: '下載', icon: Download },
  'download-cloud': { label: '下載', icon: CloudDownloadOutline },
  'download-circle': { label: '下載', icon: ArrowDownCircleOutline },
  customerService: { label: '客服', icon: HeadsetOutline },
  'customerService-filled': { label: '客服', icon: Headset },
  language: { label: '語言', icon: LanguageOutline },
  'language-filled': { label: '語言', icon: Language },
  wallet: { label: '錢包', icon: WalletOutline },
  'wallet-filled': { label: '錢包', icon: Wallet },
  'wallet-sharp': { label: '錢包', icon: WalletSharp },
  user: { label: '會員', icon: PersonOutline },
  'user-filled': { label: '會員', icon: Person },
  'user-circle': { label: '會員', icon: PersonCircleOutline },
  search: { label: '搜尋', icon: SearchOutline },
  'search-filled': { label: '搜尋', icon: Search },
  'search-circle': { label: '搜尋', icon: SearchCircleOutline },
  gift: { label: '活動', icon: GiftOutline },
  'gift-filled': { label: '活動', icon: Gift },
};
const topNavFunctionLabels: Record<string, string> = {
  notification: '通知',
  download: '下載',
  customerService: '客服',
  language: '語言',
  wallet: '錢包',
  user: '會員',
  search: '搜尋',
  gift: '活動',
};
const topNavButtons = computed(() => {
  const keys = props.module.buttonKeys ?? (props.module.variant === 'public7' ? ['wallet', 'download', 'language'] : ['notification', 'download']);
  return keys
    .map((key) => {
      const iconKey = props.module.buttonIconKeys?.[key] || key;
      const iconDefinition = topNavIcons[iconKey] || topNavIcons[key];
      return iconDefinition ? ({ key, label: topNavFunctionLabels[key] || iconDefinition.label, icon: iconDefinition.icon, source: props.module.buttonIconSources?.[key] || '' }) : null;
    })
    .filter((item): item is { key: string; label: string; icon: Component; source: string } => Boolean(item));
});
const topNavActionButtons = computed(() => topNavButtons.value.filter((item) => item.key !== 'wallet'));
const defaultBottomNavItems: NonNullable<ModuleLike['bottomNavItems']> = [
  { key: 'home', label: '首頁', activeIconKey: 'home-filled', inactiveIconKey: 'home-outline' },
  { key: 'games', label: '遊戲', activeIconKey: 'games-filled', inactiveIconKey: 'games-outline' },
  { key: 'promotion', label: '優惠', activeIconKey: 'promotion-filled', inactiveIconKey: 'promotion-outline' },
  { key: 'wallet', label: '錢包', activeIconKey: 'wallet-filled', inactiveIconKey: 'wallet-outline' },
  { key: 'main', label: '我的', activeIconKey: 'main-filled', inactiveIconKey: 'main-outline' },
];
const bottomNavIconMap: Record<string, Component> = {
  'home-filled': HomeOutline,
  'home-outline': HomeOutline,
  'games-filled': GameControllerOutline,
  'games-outline': GameControllerOutline,
  'promotion-filled': Gift,
  'promotion-outline': GiftOutline,
  'wallet-filled': Wallet,
  'wallet-outline': WalletOutline,
  'main-filled': Person,
  'main-outline': PersonOutline,
};
const bottomNavItems = computed(() => props.module.bottomNavItems?.length ? props.module.bottomNavItems : defaultBottomNavItems);
const bottomNavLayout = computed(() => ({
  center: ['index2', 'index3', 'index5', 'index7', 'index9', 'ar093', 'ar064', 'whiteGoldP3Tab'].includes(props.module.variant),
  dual: props.module.variant === 'ar093',
  text: props.module.variant === 'index6',
  compact: props.module.variant === 'rajaTab',
}));
const bottomNavCenterIndex = computed(() => Math.floor(Math.max(0, bottomNavItems.value.length - 1) / 2));
const bottomNavLayoutClass = computed(() => ({
  'fc-wire-bottom-nav--center': bottomNavLayout.value.center,
  'fc-wire-bottom-nav--dual': bottomNavLayout.value.dual,
  'fc-wire-bottom-nav--text': bottomNavLayout.value.text,
  'fc-wire-bottom-nav--compact': bottomNavLayout.value.compact,
}));
function bottomNavIcon(item: { activeIconKey: string; inactiveIconKey: string }, active: boolean) {
  return bottomNavIconMap[active ? item.activeIconKey : item.inactiveIconKey] || HomeOutline;
}

type GameSection = {
  id: string;
  name: string;
  gameIds: string[];
  displayMode: 'iconText' | 'icon' | 'text';
  iconVisible: boolean;
  iconSource?: string;
};
type GameVenueGroup = {
  id: string;
  name: string;
  subcategories: GameSection[];
};
const gameVenueGroups = computed<GameVenueGroup[]>(() => {
  const groups = props.module.gameVenues?.map((venue) => ({
    id: venue.id,
    name: venue.name,
    subcategories: venue.subcategories.map((subcategory) => ({
      id: `${venue.id}-${subcategory.id}`,
      name: subcategory.name || venue.name,
      gameIds: subcategory.gameIds || [],
      displayMode: subcategory.displayMode || 'iconText',
      iconVisible: subcategory.iconVisible !== false,
      iconSource: subcategory.iconSource || '',
    })),
  })) || [];
  return groups.filter((venue) => venue.subcategories.length);
});
const venueEntries = computed(() => gameVenueGroups.value.length
  ? gameVenueGroups.value
  : [{ id: 'venue-placeholder', name: '場館', subcategories: [] }]);
const gameSections = computed<GameSection[]>(() => {
  const sections = gameVenueGroups.value.flatMap((venue) => venue.subcategories);
  return sections.length ? sections : [
    { id: 'default-slots', name: '電子', gameIds: [], displayMode: 'iconText' as const, iconVisible: true },
    { id: 'default-live', name: '真人', gameIds: [], displayMode: 'iconText' as const, iconVisible: true },
    { id: 'default-lottery', name: '彩票', gameIds: [], displayMode: 'iconText' as const, iconVisible: true },
  ];
});
function gameCardCount(section: GameSection | undefined, fallback: number) {
  const configuredCount = section?.gameIds.length || 0;
  return Math.min(Math.max(configuredCount || fallback, 3), fallback);
}
function gameSectionClass(section: GameSection) {
  return [`fc-wire-game-title--${section.displayMode}`, { 'fc-wire-game-title--no-icon': !section.iconVisible }];
}

// 保留多列內容，讓畫布能以實際首頁方式上下滾動；每端的欄數仍依規格維持 7／3 張。
const cardCount = computed(() => props.platform === 'desktop' ? 14 : 9);
</script>
