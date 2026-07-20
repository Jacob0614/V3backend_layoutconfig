export interface MerchantSeed {
  id: string;
  code: string;
  name: string;
  brandName: string;
  publishedByPlatform: Record<'desktop' | 'mobile' | 'app', string>;
  publishedTemplateByPlatform: Record<'desktop' | 'mobile' | 'app', string>;
  sharedLayoutByPlatform: Record<'desktop' | 'mobile' | 'app', string>;
  creator: string;
  createdAt: string;
  approver: string;
  approvedAt: string;
  lastModifiedBy: string;
  lastModified: string;
}

export interface SharedLayoutReference {
  merchantId: string;
  merchantCode: string;
  brandName: string;
  platform: 'desktop' | 'mobile' | 'app';
  version: string;
  templateId: string;
}

export interface SharedLayoutSeed {
  id: string;
  label: string;
  templateId: string;
}

const MERCHANT_SEEDS: MerchantSeed[] = [
  { id: 'ar-demo', code: 'AR001', name: 'AR Demo 商戶', brandName: 'AR Demo', publishedByPlatform: { desktop: '', mobile: 'H5-D02', app: 'APP-D01' }, publishedTemplateByPlatform: { desktop: '', mobile: 'redHome', app: 'redHome' }, sharedLayoutByPlatform: { desktop: '', mobile: 'shared-redhome', app: 'shared-redhome' }, creator: 'system-admin', createdAt: '2026-07-10 10:20:00', approver: 'merchant-admin', approvedAt: '2026-07-11 16:40:00', lastModifiedBy: 'operator-01', lastModified: '2026-07-14 14:20:00' },
  { id: 'ar088', code: 'AR002', name: 'AR088 商戶', brandName: 'AR088', publishedByPlatform: { desktop: '', mobile: 'H5-D02', app: 'APP-D02' }, publishedTemplateByPlatform: { desktop: '', mobile: 'public5BlackGoldHome', app: 'public5BlackGoldHome' }, sharedLayoutByPlatform: { desktop: '', mobile: 'shared-public5-black-gold', app: 'shared-public5-black-gold' }, creator: 'operator-01', createdAt: '2026-07-08 09:15:00', approver: 'merchant-auditor', approvedAt: '2026-07-09 11:30:00', lastModifiedBy: 'merchant-admin', lastModified: '2026-07-12 09:45:00' },
  { id: 'go-game', code: 'AR003', name: 'GO Game 商戶', brandName: 'GO Game', publishedByPlatform: { desktop: '', mobile: '', app: '' }, publishedTemplateByPlatform: { desktop: '', mobile: '', app: '' }, sharedLayoutByPlatform: { desktop: '', mobile: '', app: '' }, creator: '--', createdAt: '--', approver: '--', approvedAt: '--', lastModifiedBy: '--', lastModified: '尚未配置' },
];

export const sharedLayoutCatalog: SharedLayoutSeed[] = [
  { id: 'shared-redhome', label: 'redHome／品牌 Lobby', templateId: 'redHome' },
  { id: 'shared-public5-black-gold', label: 'public5BlackGoldHome／黑金', templateId: 'public5BlackGoldHome' },
];

export function getSharedLayout(layoutId: string) {
  return sharedLayoutCatalog.find((layout) => layout.id === layoutId);
}

export function getMerchantSeed(merchantId: string) {
  return MERCHANT_SEEDS.find((merchant) => merchant.id === merchantId);
}

export function getSharedLayoutReferences(layoutId: string, platform: 'desktop' | 'mobile' | 'app'): SharedLayoutReference[] {
  return MERCHANT_SEEDS
    .filter((merchant) => merchant.sharedLayoutByPlatform[platform] === layoutId && merchant.publishedByPlatform[platform])
    .map((merchant) => ({
      merchantId: merchant.id,
      merchantCode: merchant.code,
      brandName: merchant.brandName,
      platform,
      version: merchant.publishedByPlatform[platform],
      templateId: merchant.publishedTemplateByPlatform[platform],
    }));
}

export const publishedTemplateByMerchant = Object.fromEntries(
  MERCHANT_SEEDS.map((merchant) => [merchant.id, { ...merchant.publishedTemplateByPlatform }]),
) as Record<string, Record<'desktop' | 'mobile' | 'app', string>>;

const envelope = <T>(data: T) => ({ code: 0, result: true, data, msg: 'success' });

export const api = {
  async getMerchantList() {
    return envelope({ list: MERCHANT_SEEDS.map((merchant) => ({
      ...merchant,
      publishedByPlatform: { ...merchant.publishedByPlatform },
      publishedTemplateByPlatform: { ...merchant.publishedTemplateByPlatform },
      sharedLayoutByPlatform: { ...merchant.sharedLayoutByPlatform },
    })), total: MERCHANT_SEEDS.length, totalCount: MERCHANT_SEEDS.length, pageNo: 1, pageSize: MERCHANT_SEEDS.length });
  },
};

export const http: any = new Proxy({}, {
  get() {
    return async () => envelope(null);
  },
});
