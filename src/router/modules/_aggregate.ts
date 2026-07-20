import config from './config';

// 與 V3 staticRoutes 對齊；新增業務模組只需在此聚合，不改 router 根檔。
export const staticRoutes = [...config];
