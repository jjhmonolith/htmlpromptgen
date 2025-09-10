import { ProjectData, VisualIdentity, LayoutProposal } from '../types/workflow.types';

// 깊은 객체 비교를 위한 유틸리티 함수
export const isDeepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isDeepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

// ProjectData 변경사항 감지 - 중요한 필드만 체크
export const hasProjectDataChanged = (prev: ProjectData | null, current: ProjectData): boolean => {
  if (!prev) return true;
  
  const criticalFields: (keyof ProjectData)[] = [
    'projectTitle',
    'targetAudience', 
    'layoutMode',
    'contentMode',
    'pages'
  ];
  
  for (const field of criticalFields) {
    if (!isDeepEqual(prev[field], current[field])) {
      return true;
    }
  }
  
  return false;
};

// VisualIdentity 변경사항 감지
export const hasVisualIdentityChanged = (prev: VisualIdentity | null, current: VisualIdentity): boolean => {
  if (!prev) return true;
  return !isDeepEqual(prev, current);
};

// LayoutProposal 배열 변경사항 감지
export const hasLayoutProposalsChanged = (prev: LayoutProposal[], current: LayoutProposal[]): boolean => {
  if (prev.length === 0) return true;
  return !isDeepEqual(prev, current);
};

// 데이터 해시 생성 (개선된 안정적인 해시 알고리즘)
export const generateDataHash = (data: any): string => {
  if (!data) return 'null';
  
  const normalize = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(normalize);
    
    const normalized: any = {};
    Object.keys(obj)
      .sort() // 키 순서 정규화
      .forEach(key => {
        // Date 객체는 ISO 문자열로 변환
        if (obj[key] instanceof Date) {
          normalized[key] = obj[key].toISOString();
        } else {
          normalized[key] = normalize(obj[key]);
        }
      });
    return normalized;
  };
  
  const normalizedData = normalize(data);
  const str = JSON.stringify(normalizedData);
  
  // 향상된 해시 알고리즘 (FNV-1a 변형)
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  return (hash >>> 0).toString(16); // 32비트 부호 없는 정수로 변환
};

// 변경된 필드들을 추출하는 함수
export const getChangedFields = (prev: any, current: any, parentKey = ''): string[] => {
  const changedFields: string[] = [];
  
  if (!prev || !current) return [];
  
  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(current || {})]);
  
  for (const key of allKeys) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    
    if (!isDeepEqual(prev[key], current[key])) {
      if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
        changedFields.push(...getChangedFields(prev[key], current[key], fullKey));
      } else {
        changedFields.push(fullKey);
      }
    }
  }
  
  return changedFields;
};