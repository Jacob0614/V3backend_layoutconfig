const draftKey = 'v3-frontend-custom-drafts-v1';
const discardedKey = 'v3-frontend-custom-discarded-v1';
const draftPayloadKey = 'v3-frontend-custom-draft-payloads-v1';
const sharedLayoutKey = 'v3-frontend-custom-shared-layouts-v1';

function readIds(key: string): Set<string> {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeIds(key: string, ids: Set<string>) {
  window.localStorage.setItem(key, JSON.stringify([...ids]));
}

export function hasStoredDraft(tenantId: string, fallback: boolean): boolean {
  const drafts = readIds(draftKey);
  const discarded = readIds(discardedKey);
  if (drafts.has(tenantId)) return true;
  if (discarded.has(tenantId)) return false;
  return fallback;
}

export function setStoredDraft(tenantId: string, exists: boolean) {
  const drafts = readIds(draftKey);
  const discarded = readIds(discardedKey);
  if (exists) {
    drafts.add(tenantId);
    discarded.delete(tenantId);
  } else {
    drafts.delete(tenantId);
    discarded.add(tenantId);
  }
  writeIds(draftKey, drafts);
  writeIds(discardedKey, discarded);
}

export function readStoredDraft<T>(tenantId: string): T | null {
  try {
    const payloads = JSON.parse(window.localStorage.getItem(draftPayloadKey) || '{}');
    const payload = payloads && typeof payloads === 'object' ? payloads[tenantId] : null;
    return payload && typeof payload === 'object' ? payload as T : null;
  } catch {
    return null;
  }
}

export function setStoredDraftPayload(tenantId: string, payload: unknown) {
  try {
    const payloads = JSON.parse(window.localStorage.getItem(draftPayloadKey) || '{}');
    const next = payloads && typeof payloads === 'object' ? payloads : {};
    next[tenantId] = payload;
    window.localStorage.setItem(draftPayloadKey, JSON.stringify(next));
    setStoredDraft(tenantId, true);
  } catch {
    // Keep the prototype usable when browser storage is restricted.
  }
}

export function clearStoredDraft(tenantId: string) {
  try {
    const payloads = JSON.parse(window.localStorage.getItem(draftPayloadKey) || '{}');
    const next = payloads && typeof payloads === 'object' ? payloads : {};
    delete next[tenantId];
    window.localStorage.setItem(draftPayloadKey, JSON.stringify(next));
  } catch {
    // The status cleanup below still removes the draft marker.
  }
  setStoredDraft(tenantId, false);
}

function sharedLayoutStorageKey(layoutId: string, platform: string) {
  return `${layoutId}:${platform}`;
}

export function readStoredSharedLayout<T>(layoutId: string, platform: string): T | null {
  try {
    const layouts = JSON.parse(window.localStorage.getItem(sharedLayoutKey) || '{}');
    const value = layouts && typeof layouts === 'object' ? layouts[sharedLayoutStorageKey(layoutId, platform)] : null;
    return value && typeof value === 'object' ? value as T : null;
  } catch {
    return null;
  }
}

export function setStoredSharedLayout(layoutId: string, platform: string, value: unknown) {
  try {
    const layouts = JSON.parse(window.localStorage.getItem(sharedLayoutKey) || '{}');
    const next = layouts && typeof layouts === 'object' ? layouts : {};
    next[sharedLayoutStorageKey(layoutId, platform)] = value;
    window.localStorage.setItem(sharedLayoutKey, JSON.stringify(next));
  } catch {
    // Keep the prototype usable when browser storage is restricted.
  }
}
