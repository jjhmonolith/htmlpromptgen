# Step4 개발 가이드라인 및 코딩 규칙

## 🎯 개발 철학

### 핵심 원칙
1. **안정성 우선**: 99%+ 파싱 성공률 유지가 최우선
2. **구현 가능성**: 개발자가 바로 사용할 수 있는 명세 생성
3. **교육적 가치**: 학습 효과를 극대화하는 상호작용 설계
4. **일관성**: 기존 시스템 패턴과 완벽 호환

### 기존 시스템 준수사항
✅ **반드시 따라야 할 패턴**:
- [자동 저장 시스템](auto-save-system.md) 완전 준수
- [GNB 아이콘 정책](gnb-icon-policy.md) 완전 준수
- 라인 기반 K/V 파싱 시스템 활용
- TypeScript 타입 안전성 100% 보장

---

## 📁 프로젝트 구조 규칙

### 디렉토리 구조
```
src/
├── components/workflow/Step4DesignSpecification/
│   ├── Step4DesignSpecification.tsx     # 메인 컴포넌트
│   ├── components/                      # 서브 컴포넌트들
│   │   ├── LayoutViewer.tsx
│   │   ├── StylePreview.tsx
│   │   └── InteractionPanel.tsx
│   └── index.ts                         # export 파일
├── services/
│   ├── step4-design-specification.service.ts  # 메인 서비스
│   └── engines/                         # 처리 엔진들
│       ├── LayoutRefinementEngine.ts
│       ├── StyleSpecificationEngine.ts
│       ├── InteractionDesignEngine.ts
│       └── ValidationEngine.ts
├── types/
│   └── step4.types.ts                   # Step4 전용 타입들
└── utils/
    └── step4-parsers.ts                 # 파싱 유틸리티
```

### 파일 네이밍 규칙
- **컴포넌트**: PascalCase (`Step4DesignSpecification.tsx`)
- **서비스**: kebab-case (`step4-design-specification.service.ts`)
- **타입**: kebab-case (`step4.types.ts`)
- **유틸리티**: kebab-case (`step4-parsers.ts`)

---

## 🏗️ 코딩 표준

### TypeScript 타입 정의 규칙

```typescript
// ✅ 올바른 예시
export interface Step4DesignResult {
  layoutMode: 'fixed' | 'scrollable';
  pages: Step4PageResult[];
  globalFeatures: GlobalFeature[];
  generatedAt: Date;
}

// 모든 속성에 JSDoc 주석 필수
export interface ComponentStyleSpecification {
  /** 컴포넌트 고유 ID */
  id: string;
  /** 컴포넌트 타입 */
  type: 'heading' | 'paragraph' | 'card' | 'image';
  /** 소속 섹션 ID */
  section: string;
  /** 절대 위치 (픽셀 단위) */
  position: { x: number; y: number };
  /** 크기 명세 */
  dimensions: { width: number; height: number | 'auto' };
}

// ❌ 잘못된 예시
interface BadExample {
  data: any; // any 타입 사용 금지
  position: object; // 구체적 타입 명시 필요
}
```

### 서비스 클래스 패턴

```typescript
// ✅ 표준 서비스 클래스 구조
export class Step4DesignSpecificationService {
  constructor(private openAIService: OpenAIService) {}

  /**
   * Step3 결과를 받아 정밀한 디자인 명세 생성
   * @param projectData 프로젝트 기본 정보
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @param step3Result Step3 통합 디자인 결과
   * @returns 구현 가능한 디자인 명세
   * @throws Step4GenerationError 생성 실패 시
   */
  async generateDesignSpecification(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3Result: Step3IntegratedResult
  ): Promise<Step4DesignResult> {
    try {
      console.log('🎯 Step4: 디자인 명세 생성 시작');

      // 입력 검증
      this.validateInputs(projectData, visualIdentity, step3Result);

      // 페이지별 처리
      const processedPages = await this.processAllPages(step3Result.pages, projectData, visualIdentity);

      // 글로벌 기능 추가
      const globalFeatures = this.generateGlobalFeatures(projectData.layoutMode);

      const result: Step4DesignResult = {
        layoutMode: projectData.layoutMode,
        pages: processedPages,
        globalFeatures,
        generatedAt: new Date()
      };

      console.log('✅ Step4: 디자인 명세 생성 완료');
      return result;

    } catch (error) {
      console.error('❌ Step4 생성 실패:', error);
      throw new Step4GenerationError('디자인 명세 생성 실패', error);
    }
  }

  // private 메서드들은 기능별로 명확히 분리
  private validateInputs(projectData: ProjectData, visualIdentity: VisualIdentity, step3Result: Step3IntegratedResult): void {
    if (!projectData?.pages?.length) {
      throw new Error('프로젝트 페이지 데이터가 없습니다');
    }
    // ... 추가 검증 로직
  }
}
```

### React 컴포넌트 패턴

```typescript
// ✅ 표준 컴포넌트 구조
interface Step4DesignSpecificationProps {
  /** Step3에서 전달받은 초기 데이터 */
  initialData?: Step4DesignResult;
  /** 프로젝트 기본 정보 */
  projectData: ProjectData;
  /** Step2 비주얼 아이덴티티 */
  visualIdentity: VisualIdentity;
  /** Step3 통합 디자인 결과 */
  step3Result: Step3IntegratedResult;
  /** OpenAI API 키 */
  apiKey: string;
  /** 단계 완료 시 콜백 */
  onComplete?: (data: Step4DesignResult) => void;
  /** 데이터 변경 시 콜백 (자동 저장용) */
  onDataChange?: (data: Step4DesignResult) => void;
  /** 이전 단계로 이동 콜백 */
  onBack?: () => void;
  /** 생성 상태 변경 콜백 */
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step4DesignSpecification: React.FC<Step4DesignSpecificationProps> = ({
  initialData,
  projectData,
  visualIdentity,
  step3Result,
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step4Data, setStep4Data] = useState<Step4DesignResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

  const lastStep4HashRef = useRef<string>('');

  // ✅ 자동 저장 시스템 필수 구현
  useEffect(() => {
    if (initialData) {
      setStep4Data(initialData);
      setIsDataLoaded(true);
      const initialHash = JSON.stringify(initialData);
      lastStep4HashRef.current = initialHash;
    }
  }, [initialData]);

  // ✅ GNB 생성 상태 전달
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  // ✅ 해시 기반 변경 감지 (중복 방지)
  useEffect(() => {
    if (step4Data && isDataLoaded && onDataChange) {
      const timeoutId = setTimeout(() => {
        const currentHash = JSON.stringify(step4Data);
        if (currentHash !== lastStep4HashRef.current) {
          lastStep4HashRef.current = currentHash;
          onDataChange(step4Data);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [step4Data, isDataLoaded, onDataChange]);

  // ... 나머지 컴포넌트 로직
};
```

---

## 🔧 에러 처리 패턴

### 커스텀 에러 클래스

```typescript
// ✅ Step4 전용 에러 클래스 정의
export class Step4GenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'Step4GenerationError';
  }
}

export class Step4ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'Step4ValidationError';
  }
}

export class Step4ParsingError extends Error {
  constructor(
    message: string,
    public readonly rawContent: string,
    public readonly line?: number
  ) {
    super(message);
    this.name = 'Step4ParsingError';
  }
}
```

### 에러 처리 패턴

```typescript
// ✅ 서비스에서의 에러 처리
async generateDesignSpecification(...args): Promise<Step4DesignResult> {
  try {
    // 메인 로직
    return await this.processDesignSpecification(...args);
  } catch (error) {
    console.error('❌ Step4 생성 실패:', error);

    if (error instanceof Step4ValidationError) {
      // 검증 실패 시 구체적 메시지
      throw new Error(`입력 데이터 검증 실패: ${error.field} - ${error.message}`);
    } else if (error instanceof Step4ParsingError) {
      // 파싱 실패 시 재시도 가능한 상황임을 표시
      throw new Error(`AI 응답 파싱 실패: ${error.message} (재시도 가능)`);
    } else {
      // 일반 에러는 그대로 전파
      throw error;
    }
  }
}

// ✅ 컴포넌트에서의 에러 처리
const handleGenerate = useCallback(async () => {
  if (!apiKey) {
    setError('API 키가 설정되지 않았습니다.');
    return;
  }

  try {
    setIsGenerating(true);
    setError(null);

    const result = await step4Service.generateDesignSpecification(...args);
    setStep4Data(result);
    setIsDataLoaded(true);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    setError(errorMessage);

    // 재시도 가능한 에러인지 판단
    if (errorMessage.includes('재시도 가능')) {
      // 재시도 버튼 활성화 상태로 설정
      setShouldShowRetry(true);
    }
  } finally {
    setIsGenerating(false);
  }
}, [apiKey, step4Service]);
```

---

## 📝 로깅 및 디버깅 규칙

### 로그 레벨 및 형식

```typescript
// ✅ 표준화된 로그 형식
export class Step4Logger {
  static info(message: string, data?: any) {
    console.log(`🎯 Step4: ${message}`, data ? data : '');
  }

  static success(message: string, data?: any) {
    console.log(`✅ Step4: ${message}`, data ? data : '');
  }

  static warning(message: string, data?: any) {
    console.warn(`⚠️ Step4: ${message}`, data ? data : '');
  }

  static error(message: string, error?: Error | any) {
    console.error(`❌ Step4: ${message}`, error || '');
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🔍 Step4: ${message}`, data ? data : '');
    }
  }
}

// 사용 예시
Step4Logger.info('디자인 명세 생성 시작');
Step4Logger.success('페이지별 레이아웃 정밀화 완료', { pageCount: result.pages.length });
Step4Logger.warning('일부 컴포넌트 겹침 감지', { overlaps });
Step4Logger.error('AI 응답 파싱 실패', error);
```

### 디버그 모드 지원

```typescript
// ✅ 디버그 정보 수집 패턴
export interface Step4DebugInfo {
  prompt: string;
  response: string;
  processingTime: number;
  validationResults: ValidationResult;
  generatedAt: Date;
}

// 서비스에서 디버그 정보 수집
async processPage(pageData: Step3PageData): Promise<Step4PageResult> {
  const startTime = Date.now();

  try {
    const prompt = this.buildPrompt(pageData);
    const response = await this.openAIService.generateCompletion(prompt, `Step4-Page${pageData.pageNumber}`);

    const parsed = this.parseResponse(response.content);
    const validationResult = this.validate(parsed);

    const debugInfo: Step4DebugInfo = {
      prompt,
      response: response.content,
      processingTime: Date.now() - startTime,
      validationResults: validationResult,
      generatedAt: new Date()
    };

    return {
      ...parsed,
      debugInfo: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    };

  } catch (error) {
    Step4Logger.error(`페이지 ${pageData.pageNumber} 처리 실패`, error);
    throw error;
  }
}
```

---

## 🧪 테스트 가이드라인

### 단위 테스트 패턴

```typescript
// ✅ 서비스 테스트 예시
describe('Step4DesignSpecificationService', () => {
  let service: Step4DesignSpecificationService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    mockOpenAIService = createMockOpenAIService();
    service = new Step4DesignSpecificationService(mockOpenAIService);
  });

  describe('generateDesignSpecification', () => {
    it('Step3 결과를 Step4 명세로 변환해야 함', async () => {
      // Given
      const mockProjectData = createMockProjectData();
      const mockVisualIdentity = createMockVisualIdentity();
      const mockStep3Result = createMockStep3Result();

      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: 'BEGIN_S4\nVERSION=design.v1\n...\nEND_S4'
      });

      // When
      const result = await service.generateDesignSpecification(
        mockProjectData,
        mockVisualIdentity,
        mockStep3Result
      );

      // Then
      expect(result).toMatchObject({
        layoutMode: mockProjectData.layoutMode,
        pages: expect.arrayContaining([
          expect.objectContaining({
            pageId: expect.any(String),
            layout: expect.any(Object),
            componentStyles: expect.any(Array)
          })
        ])
      });
    });

    it('입력 검증 실패 시 Step4ValidationError를 발생시켜야 함', async () => {
      // Given
      const invalidProjectData = { ...createMockProjectData(), pages: [] };

      // When & Then
      await expect(service.generateDesignSpecification(
        invalidProjectData,
        createMockVisualIdentity(),
        createMockStep3Result()
      )).rejects.toThrow(Step4ValidationError);
    });
  });
});
```

### 통합 테스트 패턴

```typescript
// ✅ 컴포넌트 통합 테스트
describe('Step4DesignSpecification Integration', () => {
  it('전체 워크플로우가 성공적으로 완료되어야 함', async () => {
    const mockProps = createMockStep4Props();

    render(<Step4DesignSpecification {...mockProps} />);

    // 초기 로딩 상태 확인
    expect(screen.getByText('디자인 명세 생성 중')).toBeInTheDocument();

    // 생성 완료까지 대기
    await waitFor(() => {
      expect(screen.getByText('디자인 명세 생성 완료')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 결과 확인
    expect(mockProps.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutMode: expect.any(String),
        pages: expect.any(Array)
      })
    );
  });
});
```

---

## 🚀 성능 최적화 가이드라인

### 메모리 관리

```typescript
// ✅ 메모리 효율적인 페이지 처리
async processAllPages(pages: Step3PageData[], ...args): Promise<Step4PageResult[]> {
  const results: Step4PageResult[] = [];

  // 병렬 처리 대신 순차 처리로 메모리 사용량 제어
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    try {
      Step4Logger.info(`페이지 ${page.pageNumber}/${pages.length} 처리 시작`);

      const result = await this.processPage(page, ...args);
      results.push(result);

      // 가비지 컬렉션 친화적: 중간 데이터 명시적 해제
      if (i % 5 === 0 && global.gc) {
        global.gc(); // 개발 환경에서만
      }

    } catch (error) {
      Step4Logger.error(`페이지 ${page.pageNumber} 처리 실패`, error);
      throw error;
    }
  }

  return results;
}
```

### API 호출 최적화

```typescript
// ✅ 재시도 및 타임아웃 설정
async generateWithRetry(prompt: string, identifier: string): Promise<any> {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // 30초

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      Step4Logger.info(`API 호출 시도 ${attempt}/${MAX_RETRIES}`, { identifier });

      const response = await Promise.race([
        this.openAIService.generateCompletion(prompt, identifier),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('타임아웃')), TIMEOUT_MS)
        )
      ]);

      return response;

    } catch (error) {
      Step4Logger.warning(`API 호출 실패 (${attempt}/${MAX_RETRIES})`, error);

      if (attempt === MAX_RETRIES) {
        throw new Step4GenerationError(`최대 재시도 횟수 초과: ${error.message}`, error);
      }

      // 지수 백오프
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 📚 개발자 참고 자료

### 필수 읽기 자료
- [자동 저장 시스템 문서](auto-save-system.md)
- [GNB 아이콘 정책 문서](gnb-icon-policy.md)
- [전체 시스템 아키텍처](step2to5%20basic%20prompt%20plan.txt)

### 코드 리뷰 체크리스트
- [ ] TypeScript 타입 안전성 100%
- [ ] 자동 저장 시스템 완전 구현
- [ ] GNB 아이콘 정책 준수
- [ ] 에러 처리 패턴 적용
- [ ] 로깅 표준 준수
- [ ] 단위 테스트 작성
- [ ] 성능 최적화 고려
- [ ] 접근성 기준 준수

### 개발 환경 설정
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "eslintConfig": {
    "rules": {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "prefer-const": "error"
    }
  }
}
```

---

*이 가이드라인을 준수하여 Step4를 개발하면 기존 시스템과 완벽히 호환되는 고품질 코드를 작성할 수 있습니다. 모든 개발자는 이 문서를 숙지한 후 개발을 시작해야 합니다.*