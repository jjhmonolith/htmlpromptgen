import CryptoJS from 'crypto-js';

const STORAGE_KEYS = {
  API_KEY: 'openai_api_key',
  COURSE_DRAFT: 'course_draft',
  PROMPT_HISTORY: 'prompt_history'
} as const;

// Simple encryption for API key storage
const ENCRYPTION_KEY = 'promptgen-local-key';

const sanitizeApiKeyValue = (apiKey: string): string => {
  if (!apiKey) return '';

  let sanitized = '';
  for (const char of apiKey) {
    const code = char.charCodeAt(0);
    if (code >= 33 && code <= 126) {
      sanitized += char;
    }
  }

  if (sanitized.length !== apiKey.length) {
    console.warn('⚠️ API 키에서 허용되지 않는 문자를 제거했습니다.');
  }

  return sanitized;
};

export const normalizeApiKey = (apiKey: string): string => sanitizeApiKeyValue(apiKey).trim();

export const saveApiKey = (apiKey: string): void => {
  const normalizedKey = normalizeApiKey(apiKey);
  const encrypted = CryptoJS.AES.encrypt(normalizedKey, ENCRYPTION_KEY).toString();
  localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
};

export const loadApiKey = (): string | null => {
  const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
  if (!encrypted) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const decoded = decrypted.toString(CryptoJS.enc.Utf8);
    const normalized = normalizeApiKey(decoded);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
};

export const clearApiKey = (): void => {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  const openaiService = (await import('./openai.service')).OpenAIService.getInstance();
  return openaiService.validateKey(normalizeApiKey(apiKey));
};

export const saveDraft = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const loadDraft = <T>(key: string): T | null => {
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const clearDraft = (key: string): void => {
  localStorage.removeItem(key);
};

// Add missing functions for WorkflowContainer
export const loadFromStorage = <T>(key: string): T | null => {
  return loadDraft<T>(key);
};

export const saveToStorage = <T>(key: string, data: T): void => {
  saveDraft(key, data);
};
