import { Step3LayoutWireframeService, LayoutWireframe, PageLayoutProposal } from '../step3-layout-wireframe.service';
import { OpenAIService } from '../openai.service';
import { ProjectData, VisualIdentity, DesignTokens } from '../../types/workflow.types';

// OpenAIService 모킹
jest.mock('../openai.service');
const MockedOpenAIService = OpenAIService as jest.MockedClass<typeof OpenAIService>;

describe('Step3LayoutWireframeService', () => {
  let service: Step3LayoutWireframeService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  const mockProjectData: ProjectData = {
    id: 'test-id',
    projectTitle: '초등학교 3학년 과학 - 물의 순환',
    targetAudience: '초등학교 3학년, 8-9세',
    layoutMode: 'scrollable',
    contentMode: 'enhanced',
    pages: [
      { id: 'page-1', pageNumber: 1, topic: '물의 순환이란 무엇일까?', description: '물의 순환의 개념과 중요성' },
      { id: 'page-2', pageNumber: 2, topic: '증발과 응결 과정', description: '태양 에너지에 의한 물의 증발' },
      { id: 'page-3', pageNumber: 3, topic: '강수와 지표수의 흐름', description: '비와 눈이 내리는 과정' }
    ],
    createdAt: new Date()
  };

  const mockVisualIdentity: VisualIdentity = {
    moodAndTone: ['명료', '친근', '탐구', '안정'],
    colorPalette: {
      primary: '#004D99',
      secondary: '#E9F4FF',
      accent: '#FFCC00',
      text: '#0F172A',
      background: '#FFFFFF'
    },
    typography: {
      headingFont: 'Pretendard',
      bodyFont: 'Noto Sans KR',
      baseSize: '20pt'
    },
    componentStyle: '라운드 20–28px와 낮은 그림자，정보를 칩으로 층위화하고 본문 가독성을 우선'
  };

  const mockDesignTokens: DesignTokens = {
    viewport: { width: 1600 },
    safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
    grid: { columns: 12, gap: 24 },
    spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
    radius: { sm: 8, md: 16, lg: 24 },
    elevation: {
      low: "0 2px 4px rgba(0, 0, 0, 0.1)",
      medium: "0 4px 8px rgba(0, 0, 0, 0.15)",
      high: "0 8px 16px rgba(0, 0, 0, 0.2)"
    },
    zIndex: { base: 0, image: 10, card: 20, text: 30 }
  };

  beforeEach(() => {
    mockOpenAIService = {
      createCompletion: jest.fn(),
      generateCompletion: jest.fn()
    } as any;
    MockedOpenAIService.mockImplementation(() => mockOpenAIService);
    service = new Step3LayoutWireframeService(mockOpenAIService);
  });

  describe('병렬 처리 테스트', () => {
    test('단일 페이지를 올바르게 생성한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
PAGE_STYLE=pattern=educational,motif=science,rhythm=balanced,asymmetry=moderate
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="물의 순환 개념 소개"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="핵심 메시지 전달"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=96, hint="상세 설명과 이미지"
IMG_BUDGET=1
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SLOT, id=secB-message, section=secB, type=card, variant=highlight
SLOT, id=secC-text, section=secC, type=paragraph, variant=Body, gridSpan=left
SLOT, id=secC-img, section=secC, type=image, variant=none, gridSpan=right, slotRef=IMG1
SUMMARY, sections=3, slots=4, imageSlots=1
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);

      expect(result.pages).toHaveLength(1);
      expect(result.layoutMode).toBe('scrollable');
      expect(result.pages[0].pageTitle).toBe('물의 순환이란 무엇일까?');
      expect(result.pages[0].wireframe?.sections).toHaveLength(3);
      expect(result.pages[0].wireframe?.slots).toHaveLength(4);
    });

    test('다중 페이지를 병렬로 올바르게 생성한다', async () => {
      const mockResponses = [
        { content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="페이지 1 소개"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="핵심 메시지"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=96, hint="내용"
IMG_BUDGET=1
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=3, slots=1, imageSlots=0
END_S3_SLOTS` },
        { content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=B:keyMessage
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="페이지 2 소개"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="핵심 메시지"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=96, hint="내용"
IMG_BUDGET=2
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=3, slots=1, imageSlots=0
END_S3_SLOTS` },
        { content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=E:bridge
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="페이지 3 소개"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="핵심 메시지"
SECTION, id=secC, role=bridge, grid=8+4, height=auto, gapBelow=96, hint="마무리"
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=3, slots=1, imageSlots=0
END_S3_SLOTS` }
      ];

      mockOpenAIService.generateCompletion
        .mockResolvedValueOnce(mockResponses[0] as any)
        .mockResolvedValueOnce(mockResponses[1] as any)
        .mockResolvedValueOnce(mockResponses[2] as any);

      const result = await service.generateLayoutWireframe(mockProjectData, mockVisualIdentity, mockDesignTokens);

      expect(result.pages).toHaveLength(3);
      expect(result.pages[0].pageNumber).toBe(1);
      expect(result.pages[1].pageNumber).toBe(2);
      expect(result.pages[2].pageNumber).toBe(3);

      // 병렬 처리로 순서가 정렬되어 있는지 확인
      expect(result.pages[0].wireframe?.flow).toBe('A:intro');
      expect(result.pages[1].wireframe?.flow).toBe('B:keyMessage');
      expect(result.pages[2].wireframe?.flow).toBe('E:bridge');
    });

    test('병렬 처리 중 일부 페이지 실패 시 전체 실패한다', async () => {
      mockOpenAIService.generateCompletion
        .mockResolvedValueOnce({ content: 'valid response' } as any)
        .mockRejectedValueOnce(new Error('Page 2 failed'))
        .mockResolvedValueOnce({ content: 'valid response' } as any);

      await expect(service.generateLayoutWireframe(mockProjectData, mockVisualIdentity, mockDesignTokens))
        .rejects.toThrow('Page 2 failed');
    });
  });

  describe('두 블록 파싱 테스트', () => {
    test('정상적인 두 블록 형식을 올바르게 파싱한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
PAGE_STYLE=pattern=educational,motif=science,rhythm=balanced,asymmetry=moderate
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="제목과 부제목"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="핵심 메시지"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=96, hint="상세 내용"
IMG_BUDGET=2
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SLOT, id=secB-message, section=secB, type=card, variant=highlight
SLOT, id=secC-text, section=secC, type=paragraph, variant=Body, gridSpan=left
SLOT, id=secC-img, section=secC, type=image, variant=none, gridSpan=right, slotRef=IMG1
SUMMARY, sections=3, slots=4, imageSlots=1
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      expect(page.wireframe?.version).toBe('wire.v1');
      expect(page.wireframe?.viewportMode).toBe('scrollable');
      expect(page.wireframe?.flow).toBe('A:intro');
      expect(page.wireframe?.imgBudget).toBe(2);
      expect(page.wireframe?.pageStyle).toEqual({
        pattern: 'educational',
        motif: 'science',
        rhythm: 'balanced',
        asymmetry: 'moderate'
      });
      expect(page.wireframe?.sections).toHaveLength(3);
      expect(page.wireframe?.slots).toHaveLength(4);
      expect(page.wireframe?.summary).toEqual({
        sections: 3,
        slots: 4,
        imageSlots: 1
      });
    });

    test('LAYOUT 블록만 있을 때 최소 와이어프레임을 생성한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="제목"
IMG_BUDGET=1
END_S3_LAYOUT`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // SLOTS 블록이 없으면 최소 와이어프레임 생성
      expect(page.wireframe).not.toBeNull();
      expect(page.wireframe?.sections).toHaveLength(5); // synthesizeMinimalWireframe
      expect(page.layoutDescription).toContain('페이지 **상단**에');
    });

    test('SLOTS 블록만 있을 때 최소 와이어프레임을 생성한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=1, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // LAYOUT 블록이 없으면 최소 와이어프레임 생성
      expect(page.wireframe).not.toBeNull();
      expect(page.wireframe?.sections).toHaveLength(5);
      expect(page.layoutDescription).toContain('페이지 **상단**에');
    });

    test('블록이 없을 때 최소 와이어프레임을 생성한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `물의 순환에 대한 일반적인 설명입니다. 마커가 없어요.`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // 최소 와이어프레임이 생성되어야 함
      expect(page.wireframe).not.toBeNull();
      expect(page.wireframe?.version).toBe('wire.v1');
      expect(page.wireframe?.sections).toHaveLength(5); // synthesizeMinimalWireframe의 기본 섹션 수
      expect(page.wireframe?.flow).toBe('A:intro'); // 첫 번째 페이지
      expect(page.layoutDescription).toContain('페이지 **상단**에'); // 폴백 설명
    });
  });

  describe('폴백 시스템 테스트', () => {
    test('computePageFlow가 올바르게 계산된다', async () => {
      // 유효한 응답으로 mock 설정
      mockOpenAIService.generateCompletion.mockResolvedValue({ content: 'invalid response', usage: {} });

      const result = await service.generateLayoutWireframe(mockProjectData, mockVisualIdentity, mockDesignTokens);

      // 3페이지 프로젝트에서 FLOW 확인 (폴백 사용)
      expect(result.pages[0].wireframe?.flow).toBe('A:intro'); // 첫 페이지
      expect(result.pages[1].wireframe?.flow).toBe('B:keyMessage'); // 두 번째 페이지
      expect(result.pages[2].wireframe?.flow).toBe('E:bridge'); // 마지막 페이지
    });

    test('synthesizeMinimalWireframe이 올바른 구조를 생성한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      // 파싱 실패를 유도하는 응답
      mockOpenAIService.generateCompletion.mockResolvedValue({ content: 'invalid response', usage: {} });

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      expect(page.wireframe?.version).toBe('wire.v1');
      expect(page.wireframe?.flow).toBe('A:intro');
      expect(page.wireframe?.sections).toHaveLength(5);
      expect(page.wireframe?.imgBudget).toBe(1);
      expect(page.wireframe?.pageStyle).toEqual({
        pattern: 'baseline',
        motif: 'plain',
        rhythm: 'balanced',
        asymmetry: 'moderate'
      });
    });

    test('createPlainDescriptionFallback이 적절한 설명을 생성한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      // 파싱 실패를 유도
      const mockResponse = { content: 'invalid response' };
      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const description = result.pages[0].layoutDescription;

      expect(description).toContain('페이지 **상단**에');
      expect(description).toContain('**중간 영역**에는');
      expect(description).toContain('스크롤 가능한 레이아웃');
    });

    test('fixed 모드에서 적절한 폴백 설명을 생성한다', async () => {
      const fixedProject = { ...mockProjectData, layoutMode: 'fixed' as const, pages: [mockProjectData.pages[0]] };

      const mockResponse = { content: 'invalid response' };
      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(fixedProject, mockVisualIdentity, mockDesignTokens);
      const description = result.pages[0].layoutDescription;

      expect(description).toContain('고정 뷰포트 내에서');
    });
  });

  describe('정규화 및 파싱 테스트', () => {
    test('gapBelow 값이 올바르게 정규화된다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=70, hint="70은 80으로 스냅"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=90, hint="90은 96으로 스냅"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=60, hint="60은 64로 스냅"
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=3, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const sections = result.pages[0].wireframe?.sections;

      expect(sections?.[0].gapBelow).toBe(64); // 70 → 64
      expect(sections?.[1].gapBelow).toBe(96); // 90 → 96
      expect(sections?.[2].gapBelow).toBe(64); // 60 → 64
    });

    test('정규식 기반 레코드 파싱이 올바르게 작동한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id="secA", role="intro", grid="1-12", height="auto", gapBelow="64", hint="따옴표 포함 테스트"
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id="slot1", section="secA", type="heading", variant="H1", gridSpan="left"
SUMMARY, sections=1, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      expect(page.wireframe?.sections?.[0]).toEqual({
        id: 'secA',
        role: 'intro',
        grid: '1-12',
        height: 'auto',
        gapBelow: 64,
        hint: '따옴표 포함 테스트'
      });

      expect(page.wireframe?.slots?.[0]).toEqual({
        id: 'slot1',
        section: 'secA',
        type: 'heading',
        variant: 'H1',
        gridSpan: 'left'
      });
    });

    test('정규화 응답이 올바르게 처리된다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      // 전각 쉼표, HTML 태그, 스마트 따옴표 포함
      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION，id=secA，role=intro，grid=1-12，height=auto，gapBelow=64，hint="HTML<strong>태그</strong>포함"
IMG_BUDGET=1
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT，id=slot1，section=secA，type=heading，variant=H1
SUMMARY，sections=1，slots=1，imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      expect(page.wireframe?.sections?.[0].hint).toBe('HTML태그포함'); // HTML 태그 제거됨
    });

    test('splitLinesSafely가 한 줄 = 한 레코드를 보장한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      // 한 줄에 여러 레코드가 섞인 응답
      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1 SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="잘못된 형식"
VIEWPORT_MODE=scrollable SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="또 다른 잘못된 형식"
FLOW=A:intro
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1 SUMMARY, sections=2, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // splitLinesSafely가 제대로 분리했는지 확인
      expect(page.wireframe?.sections).toHaveLength(2);
      expect(page.wireframe?.sections?.[0].id).toBe('secA');
      expect(page.wireframe?.sections?.[1].id).toBe('secB');
      expect(page.wireframe?.slots).toHaveLength(1);
      expect(page.wireframe?.summary?.sections).toBe(2);
    });

    test('SECTION 정책 강제가 올바르게 작동한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=invalid-grid, height=200px, gapBelow=64, hint="잘못된 grid와 height"
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=1, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // 정책 강제 확인
      expect(page.wireframe?.sections?.[0].height).toBe('auto'); // 항상 auto로 강제
      expect(page.wireframe?.sections?.[0].grid).toBe('1-12'); // 유효하지 않은 grid는 1-12로 보정
    });
  });

  describe('데이터 구조 검증 테스트', () => {
    test('완전한 와이어프레임 데이터가 생성된다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="섹션 1"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=80, hint="섹션 2"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=96, hint="섹션 3"
IMG_BUDGET=1
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SLOT, id=secC-text, section=secC, type=paragraph, variant=Body, gridSpan=left
SLOT, id=secC-img, section=secC, type=image, variant=none, gridSpan=right
SUMMARY, sections=3, slots=3, imageSlots=1
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // 기본 구조 검증
      expect(page.wireframe?.version).toBe('wire.v1');
      expect(page.wireframe?.viewportMode).toBe('scrollable');
      expect(page.wireframe?.flow).toBe('A:intro');
      expect(page.wireframe?.imgBudget).toBe(1);
      expect(page.wireframe?.sections).toHaveLength(3);
      expect(page.wireframe?.slots).toHaveLength(3);
      expect(page.wireframe?.summary).toBeDefined();
    });

    test('최소 와이어프레임이 유효한 구조를 가진다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      // 파싱 실패를 유도하는 응답
      mockOpenAIService.generateCompletion.mockResolvedValue({ content: 'invalid response', usage: {} });

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // 최소 와이어프레임 검증
      expect(page.wireframe?.sections).toHaveLength(5); // 5개 기본 섹션
      expect(page.wireframe?.slots).toHaveLength(2); // 2개 기본 슬롯
      expect(page.wireframe?.imgBudget).toBe(1);

      // 필수 섹션 역할 검증
      const roles = page.wireframe?.sections?.map(s => s.role);
      expect(roles).toContain('intro');
      expect(roles).toContain('keyMessage');
      expect(roles).toContain('content');
      expect(roles).toContain('compare');
      expect(roles).toContain('bridge');
    });

    test('섹션과 슬롯의 참조 무결성이 유지된다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="섹션 A"
SECTION, id=secB, role=keyMessage, grid=8+4, height=auto, gapBelow=80, hint="섹션 B"
IMG_BUDGET=1
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=slotA, section=secA, type=heading, variant=H1
SLOT, id=slotB1, section=secB, type=paragraph, variant=Body, gridSpan=left
SLOT, id=slotB2, section=secB, type=image, variant=none, gridSpan=right
SUMMARY, sections=2, slots=3, imageSlots=1
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const page = result.pages[0];

      // 모든 슬롯이 유효한 섹션을 참조하는지 확인
      const sectionIds = new Set(page.wireframe?.sections?.map(s => s.id));
      page.wireframe?.slots?.forEach(slot => {
        expect(sectionIds.has(slot.section)).toBe(true);
      });
    });
  });

  describe('와이어프레임 설명 변환 테스트', () => {
    test('구조화된 와이어프레임을 읽기 쉬운 설명으로 변환한다', async () => {
      const singlePageProject = { ...mockProjectData, pages: [mockProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=scrollable
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="제목과 부제목"
SECTION, id=secB, role=keyMessage, grid=8+4, height=auto, gapBelow=80, hint="핵심 메시지와 이미지"
SECTION, id=secC, role=content, grid=2-11, height=auto, gapBelow=96, hint="상세 설명"
IMG_BUDGET=1
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SLOT, id=secB-text, section=secB, type=paragraph, variant=Body, gridSpan=left
SLOT, id=secB-img, section=secB, type=image, variant=none, gridSpan=right
SUMMARY, sections=3, slots=3, imageSlots=1
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const description = result.pages[0].layoutDescription;

      expect(description).toContain('상단');
      expect(description).toContain('좌우 분할 레이아웃');
      expect(description).toContain('중앙 정렬');
      expect(description).toContain('제목과 부제목이 강조되어 표시됩니다');
      expect(description).toContain('핵심 메시지가 카드 형태로 전달됩니다');
      expect(description).toContain('1개의 이미지와 다이어그램이 포함됩니다');
      expect(description).toContain('스크롤 가능한 레이아웃');
    });

    test('고정형 레이아웃 설명을 생성한다', async () => {
      const fixedProjectData = { ...mockProjectData, layoutMode: 'fixed' as const };
      const singlePageProject = { ...fixedProjectData, pages: [fixedProjectData.pages[0]] };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=fixed
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="제목"
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=1, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateLayoutWireframe(singlePageProject, mockVisualIdentity, mockDesignTokens);
      const description = result.pages[0].layoutDescription;

      expect(description).toContain('고정 뷰포트 내에서 모든 내용을 효율적으로 배치합니다');
    });
  });

  describe('프롬프트 생성 테스트', () => {
    test('contentMode와 layoutMode에 따른 가이드라인이 포함된다', async () => {
      const restrictedFixedProject = {
        ...mockProjectData,
        contentMode: 'restricted' as const,
        layoutMode: 'fixed' as const,
        pages: [mockProjectData.pages[0]]
      };

      const mockResponse = {
        content: `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=fixed
FLOW=A:intro
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="제한된 내용"
IMG_BUDGET=0
END_S3_LAYOUT

BEGIN_S3_SLOTS
SLOT, id=secA-title, section=secA, type=heading, variant=H1
SUMMARY, sections=1, slots=1, imageSlots=0
END_S3_SLOTS`
      };

      mockOpenAIService.generateCompletion.mockResolvedValue(mockResponse as any);

      await service.generateLayoutWireframe(restrictedFixedProject, mockVisualIdentity, mockDesignTokens);

      const callArgs = mockOpenAIService.generateCompletion.mock.calls[0][0];

      expect(callArgs).toContain('콘텐츠 모드: restricted');
      expect(callArgs).toContain('레이아웃 모드: fixed');
      expect(callArgs).toContain('입력된 설명 범위 내에서만 구성하세요');
      expect(callArgs).toContain('한 화면 내 핵심 내용 집약');
      expect(callArgs).toContain('네비게이션 버튼을 포함하지 마세요');
    });

    test('페이지별 FLOW가 올바르게 설정된다', async () => {
      const mockResponses = [
        { content: 'valid response 1' },
        { content: 'valid response 2' },
        { content: 'valid response 3' }
      ];

      mockOpenAIService.generateCompletion
        .mockResolvedValueOnce(mockResponses[0] as any)
        .mockResolvedValueOnce(mockResponses[1] as any)
        .mockResolvedValueOnce(mockResponses[2] as any);

      await service.generateLayoutWireframe(mockProjectData, mockVisualIdentity, mockDesignTokens);

      const calls = mockOpenAIService.generateCompletion.mock.calls;

      expect(calls[0][0]).toContain('FLOW=A:intro'); // 첫 페이지
      expect(calls[1][0]).toContain('FLOW=B:keyMessage'); // 두 번째 페이지
      expect(calls[2][0]).toContain('FLOW=E:bridge'); // 마지막 페이지
    });
  });
});