import { Step2VisualIdentityService } from '../step2-visual-identity.service';
import { OpenAIService } from '../openai.service';
import { ProjectData } from '../../types/workflow.types';

// OpenAIService 모킹
jest.mock('../openai.service');
const MockedOpenAIService = OpenAIService as jest.MockedClass<typeof OpenAIService>;

describe('Step2VisualIdentityService', () => {
  let service: Step2VisualIdentityService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  const mockProjectData: ProjectData = {
    id: 'test-id',
    projectTitle: 'React 기초 강의',
    targetAudience: '웹 개발 입문자',
    layoutMode: 'scrollable',
    contentMode: 'enhanced',
    pages: [
      { id: 'page-1', pageNumber: 1, topic: 'React 소개', description: 'React의 기본 개념' }
    ],
    createdAt: new Date()
  };

  beforeEach(() => {
    mockOpenAIService = {
      createCompletion: jest.fn(),
      generateCompletion: jest.fn()
    } as any;
    MockedOpenAIService.mockImplementation(() => mockOpenAIService);
    service = new Step2VisualIdentityService(mockOpenAIService);
  });

  describe('라인 기반 파싱 테스트', () => {
    test('정상적인 Step2 응답을 올바르게 파싱한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=명료,친근,탐구,안정
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=라운드 20–28px와 낮은 그림자，정보를 칩으로 층위화하고 본문 가독성을 우선
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      expect(result.visualIdentity.moodAndTone).toEqual(['명료', '친근', '탐구', '안정']);
      expect(result.visualIdentity.colorPalette.primary).toBe('#004D99');
      expect(result.visualIdentity.colorPalette.secondary).toBe('#E9F4FF');
      expect(result.visualIdentity.colorPalette.accent).toBe('#FFCC00');
      expect(result.visualIdentity.typography.baseSize).toBe('20pt');
      expect(result.visualIdentity.componentStyle).toBe('라운드 20–28px와 낮은 그림자,정보를 칩으로 층위화하고 본문 가독성을 우선');
    });

    test('브랜드 잠금값이 올바르게 적용된다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,혁신,직관,신뢰
COLOR_PRIMARY=#2563EB
COLOR_SECONDARY=#F3F4F6
COLOR_ACCENT=#10B981
BASE_SIZE_PT=18
COMPONENT_STYLE=심플하고 깔끔한 디자인
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      // 브랜드 잠금값 확인
      expect(result.visualIdentity.colorPalette.text).toBe('#0F172A');
      expect(result.visualIdentity.colorPalette.background).toBe('#FFFFFF');
      expect(result.visualIdentity.typography.headingFont).toBe('Pretendard');
      expect(result.visualIdentity.typography.bodyFont).toBe('Noto Sans KR');
    });

    test('HEX 색상 정규화가 올바르게 작동한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#abc
COLOR_SECONDARY=e9f4ff
COLOR_ACCENT=#10B981
BASE_SIZE_PT=20
COMPONENT_STYLE=기본 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      // 3자리 HEX가 6자리로 확장되어야 함
      expect(result.visualIdentity.colorPalette.primary).toBe('#aabbcc');
      // # 없이 입력된 것이 정규화되어야 함
      expect(result.visualIdentity.colorPalette.secondary).toBe('#E9F4FF');
    });

    test('BASE_SIZE_PT 검증이 올바르게 작동한다', async () => {
      const testCases = [
        { input: '18', expected: '18pt' },
        { input: '20', expected: '20pt' },
        { input: '16', expected: '20pt' }, // 유효하지 않은 값은 기본값으로
        { input: '22', expected: '20pt' }, // 유효하지 않은 값은 기본값으로
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          choices: [{
            message: {
              content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=${testCase.input}
COMPONENT_STYLE=기본 스타일
END_S2`
            }
          }]
        };

        mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

        const result = await service.generateVisualIdentity(mockProjectData);
        expect(result.visualIdentity.typography.baseSize).toBe(testCase.expected);
      }
    });

    test('전각 쉼표가 반각 쉼표로 정규화된다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=명료,친근,탐구,안정
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=라운드 20–28px와 낮은 그림자，정보를 칩으로 층위화하고 본문 가독성을 우선
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);
      expect(result.visualIdentity.componentStyle).toBe('라운드 20–28px와 낮은 그림자,정보를 칩으로 층위화하고 본문 가독성을 우선');
    });
  });

  describe('레이아웃 모드별 토큰 테스트', () => {
    test('fixed 모드에서 올바른 디자인 토큰을 반환한다', async () => {
      const fixedProjectData = { ...mockProjectData, layoutMode: 'fixed' as const };
      
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=기본 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(fixedProjectData);

      expect(result.designTokens.viewport.width).toBe(1600);
      expect(result.designTokens.viewport.height).toBe(1000); // fixed 모드
    });

    test('scrollable 모드에서 올바른 디자인 토큰을 반환한다', async () => {
      const scrollableProjectData = { ...mockProjectData, layoutMode: 'scrollable' as const };
      
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=기본 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(scrollableProjectData);

      expect(result.designTokens.viewport.width).toBe(1600);
      expect(result.designTokens.viewport.height).toBeUndefined(); // scrollable 모드
    });
  });

  describe('폴백 시스템 테스트', () => {
    test('API 호출 실패 시 폴백 결과를 반환한다', async () => {
      mockOpenAIService.createCompletion.mockRejectedValue(new Error('API Error'));

      const result = await service.generateVisualIdentity(mockProjectData);

      // 폴백 데이터 확인
      expect(result.visualIdentity.moodAndTone).toEqual(['명료', '친근', '탐구', '안정']);
      expect(result.visualIdentity.colorPalette.primary).toBe('#004D99');
      expect(result.visualIdentity.colorPalette.secondary).toBe('#E9F4FF');
      expect(result.visualIdentity.colorPalette.accent).toBe('#FFCC00');
      expect(result.visualIdentity.typography.baseSize).toBe('20pt');
    });

    test('잘못된 마커 응답에 대해 폴백 결과를 반환한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `잘못된 형식의 응답입니다. 마커가 없어요.`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      // 폴백 데이터 확인
      expect(result.visualIdentity.moodAndTone).toEqual(['명료', '친근', '탐구', '안정']);
      expect(result.visualIdentity.colorPalette.text).toBe('#0F172A');
      expect(result.visualIdentity.colorPalette.background).toBe('#FFFFFF');
    });

    test('빈 응답에 대해 폴백 결과를 반환한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      expect(result.visualIdentity.moodAndTone).toEqual(['명료', '친근', '탐구', '안정']);
    });
  });

  describe('품질 게이트 테스트', () => {
    test('부분적으로 누락된 데이터에 대해 경고를 로깅하고 기본값을 사용한다', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=짧은,무드
COLOR_PRIMARY=잘못된색상
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=25
COMPONENT_STYLE=기본 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Step2 검증 경고:', expect.arrayContaining([
        'MOOD 형용사 4개 필요'
      ]));

      // 기본값으로 보정되어야 함
      expect(result.visualIdentity.colorPalette.primary).toBe('#004D99');
      expect(result.visualIdentity.typography.baseSize).toBe('20pt');

      consoleSpy.mockRestore();
    });
  });

  describe('프롬프트 생성 테스트', () => {
    test('올바른 형식의 프롬프트를 생성한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=기본 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      await service.generateVisualIdentity(mockProjectData);

      // 프롬프트가 올바른 형식으로 생성되었는지 확인
      expect(mockOpenAIService.createCompletion).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{ 
          role: 'user', 
          content: expect.stringContaining('교육용 프로젝트를 위한 비주얼 아이덴티티를 설계해주세요')
        }],
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1000,
        stop: ["END_S2"]
      });

      // 프롬프트에 프로젝트 데이터가 포함되었는지 확인
      const callArgs = mockOpenAIService.createCompletion.mock.calls[0][0];
      const promptContent = callArgs.messages[0].content;
      expect(promptContent).toContain('React 기초 강의');
      expect(promptContent).toContain('웹 개발 입문자');
      expect(promptContent).toContain('scrollable');
      expect(promptContent).toContain('enhanced');
    });

    test('contentMode이 restricted인 경우 올바른 프롬프트를 생성한다', async () => {
      const restrictedProjectData = { ...mockProjectData, contentMode: 'restricted' as const };

      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=18
COMPONENT_STYLE=제한적 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(restrictedProjectData);

      // 프롬프트에 restricted 모드 관련 내용이 포함되었는지 확인
      const callArgs = mockOpenAIService.createCompletion.mock.calls[0][0];
      const promptContent = callArgs.messages[0].content;
      expect(promptContent).toContain('restricted');
      expect(result.visualIdentity.typography.baseSize).toBe('18pt'); // restricted 모드는 기본적으로 18pt
    });

    test('온도 및 매개변수가 올바르게 설정된다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=기본 스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      await service.generateVisualIdentity(mockProjectData);

      // API 호출 매개변수 확인
      expect(mockOpenAIService.createCompletion).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: expect.any(String)
        }],
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1000,
        stop: ["END_S2"]
      });
    });
  });

  describe('라인 기반 형식 검증 테스트', () => {
    test('마커 누락 시 폴백을 사용한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `VERSION=vi.v1
MOOD=모던,깔끔,전문,신뢰
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=마커가 없는 응답`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      // 폴백 데이터 확인 (마커가 없어서 파싱 실패)
      expect(result.visualIdentity.moodAndTone).toEqual(['명료', '친근', '탐구', '안정']);
    });

    test('라인 기반 형식 검증이 올바르게 작동한다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=명료,친근,탐구,안정
COLOR_PRIMARY=#004D99
COLOR_SECONDARY=#E9F4FF
COLOR_ACCENT=#FFCC00
BASE_SIZE_PT=20
COMPONENT_STYLE=라운드 모서리와 그림자 효과
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      // 정확한 파싱 확인
      expect(result.visualIdentity.moodAndTone).toHaveLength(4);
      expect(result.visualIdentity.colorPalette.primary).toMatch(/^#[0-9A-F]{6}$/i);
      expect(result.visualIdentity.typography.baseSize).toMatch(/^\d+(pt)$/);
    });
  });

  describe('정규화 및 검증 테스트', () => {
    test('여러 정규화 규칙이 동시에 적용된다', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `BEGIN_S2
VERSION=vi.v1
MOOD=짧은，무드，만
COLOR_PRIMARY=#abc
COLOR_SECONDARY=e9f4ff
COLOR_ACCENT=#10B981
BASE_SIZE_PT=16
COMPONENT_STYLE=전각 콤마가，포함된，스타일
END_S2`
          }
        }]
      };

      mockOpenAIService.createCompletion.mockResolvedValue(mockResponse as any);

      const result = await service.generateVisualIdentity(mockProjectData);

      // 여러 정규화 확인
      expect(result.visualIdentity.colorPalette.primary).toBe('#aabbcc');
      expect(result.visualIdentity.colorPalette.secondary).toBe('#E9F4FF');
      expect(result.visualIdentity.componentStyle).toBe('전각 콤마가,포함된,스타일');
      expect(result.visualIdentity.typography.baseSize).toBe('20pt'); // 16은 유효하지 않으므로 기본값
    });
  });
});