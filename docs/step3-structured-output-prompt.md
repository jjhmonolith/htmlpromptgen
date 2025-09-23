# Step3 Structured Output Prompt & Function Spec (Draft)

## 1. 목표

- OpenAI 응답을 명확한 JSON 구조로 얻어 Step3 파이프라인의 파싱 불안정을 제거한다.
- `educational-design.service.ts`에서 사용하는 프롬프트를 function calling 기반으로 재구성한다.
- 실패/예외 시나리오와 fallback 정책을 정의한다.

## 2. Function Specification 초안

```ts
const educationalDesignFunction = {
  name: 'create_step3_layout',
  description: 'Generate structured educational layout data for Step3 UI and downstream services',
  parameters: {
    type: 'object',
    required: ['page', 'structure', 'content'],
    properties: {
      page: {
        type: 'object',
        required: ['id', 'title', 'number'],
        properties: {
          id: { type: 'string', description: 'Page identifier (match projectData.pages[*].id)' },
          title: { type: 'string' },
          number: { type: 'integer', minimum: 1 },
          layoutMode: { type: 'string', enum: ['fixed', 'scrollable'] },
          summary: { type: 'string', description: 'Full rich description (markdown allowed)' },
          processing: {
            type: 'object',
            properties: {
              timeMs: { type: 'number' },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        }
      },
      structure: {
        type: 'object',
        required: ['sections'],
        properties: {
          flow: { type: 'string' },
          sections: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'label', 'role', 'description', 'layout'],
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                role: { type: 'string', enum: ['title', 'content'] },
                description: { type: 'string' },
                layout: {
                  type: 'object',
                  properties: {
                    startPx: { type: 'number' },
                    heightPx: { type: 'number' },
                    grid: { type: 'string', enum: ['1-12', '8+4', '2-11', '3-10', 'custom'] },
                    gridNote: { type: 'string' }
                  }
                },
                transition: { type: 'string', description: 'Color/shape guidance between sections' },
                components: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'IDs of components belonging to this section'
                }
              }
            }
          }
        }
      },
      content: {
        type: 'object',
        required: ['components', 'images', 'interactions'],
        properties: {
          components: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'type', 'sectionId', 'role'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['heading', 'paragraph', 'card', 'image', 'list', 'interactive', 'chart'] },
                sectionId: { type: 'string' },
                role: { type: 'string', enum: ['title', 'content'] },
                priority: { type: 'integer', minimum: 1, maximum: 3 },
                text: { type: 'string' },
                mediaRef: { type: 'string' },
                grid: {
                  type: 'object',
                  properties: {
                    span: { type: 'string', enum: ['full', 'left', 'right'] },
                    widthPx: { type: 'number' },
                    heightPx: { type: 'number' }
                  }
                }
              }
            }
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'purpose', 'sectionId'],
              properties: {
                id: { type: 'string' },
                sectionId: { type: 'string' },
                filename: { type: 'string' },
                suggestedPath: { type: 'string' },
                purpose: { type: 'string' },
                placement: { type: 'string', enum: ['left', 'right', 'center'] },
                sizeGuide: { type: 'string' },
                description: { type: 'string' },
                altText: { type: 'string' },
                caption: { type: 'string' },
                aiPrompt: { type: 'string' },
                style: { type: 'string' }
              }
            }
          },
          interactions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'trigger', 'action', 'purpose'],
              properties: {
                id: { type: 'string' },
                sectionId: { type: 'string' },
                trigger: { type: 'string' },
                action: { type: 'string' },
                purpose: { type: 'string' },
                feedback: { type: 'string' },
                type: { type: 'string' },
                required: { type: 'boolean' }
              }
            }
          }
        }
      },
      visual: {
        type: 'object',
        properties: {
          layout: {
            type: 'object',
            properties: {
              containerWidth: { type: 'number' },
              safePadding: { type: 'string' },
              columnSpec: { type: 'string' },
              gutter: { type: 'string' }
            }
          },
          styleGuides: {
            type: 'array',
            items: { type: 'string' }
          },
          typography: {
            type: 'object',
            properties: {
              heading: { type: 'string' },
              body: { type: 'string' },
              caption: { type: 'string' }
            }
          },
          accessibility: {
            type: 'object',
            properties: {
              contrast: { type: 'string' },
              touchTarget: { type: 'string' },
              reducedMotion: { type: 'string' }
            }
          },
          quality: {
            type: 'object',
            properties: {
              warnings: { type: 'array', items: { type: 'string' } },
              suggestions: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  }
};
```

- `content.components` → Step3 `ComponentLine`
- `structure.sections` → Step3 `Step3Section`
- `visual` → Step4 프롬프트 및 QA 참고
- `summary` → 기존 `fullDescription`

## 3. 프롬프트 구조 (초안)

### 3.1 시스템 메시지

```
You are an educational design AI that produces structured JSON following the provided function schema. Do not output natural language. Capture layout, components, interactions, and visual guidelines for developers.
```

### 3.2 사용자 메시지

- 기존 `createEducationalDesignPrompt` 텍스트 중 핵심 지시를 유지하고, 마지막에 **명시적 구조화 요구**를 추가한다:

```
... (프로젝트/페이지 컨텍스트)

Return the result by calling `create_step3_layout` with all required fields. Ensure:
- sections follow the vertical order and include start/height in pixels
- components reference existing section IDs and describe their role
- interactions capture at least 2 learning activities when available
- images include suggested filenames within `image/page{pageNumber}/`
- summary contains the full markdown description for fallback display
```

- 필요 시 `visualIdentity`/`layout` 맥락도 사용자 메시지에 JSON 형태로 전달.

## 4. 응답 처리 전략

1. **우선순위**
   1. Function call JSON 성공 → 그대로 사용
   2. JSON 실패 (e.g. text response) → LLM에 “convert above text to JSON following schema” 재요청
   3. 여전히 실패 → 기존 텍스트 파서 fallback + 경고 로그

2. **에러 처리**
   - `OpenAIService.generateCompletion`에서 `response.type === 'function_call'` 여부 확인
   - JSON parse 예외 발생 시 재시도 (1회) 후 fallback
   - Validation: 필수 필드 누락 시 기본 값 보강 (예: 섹션 2개 생성)

3. **로깅**
   - `debugInfo.parsedSections.format = 'structured-json' | 'converted-json' | 'legacy-text'` 등으로 출처 기록

## 5. Todo / Implementation Notes

- [ ] `OpenAIService`에 함수 호출 옵션 추가 (`client.responses.create` + `response_format`)
- [ ] `EducationalDesignService` 프롬프트 업데이트
- [ ] Function 인자 객체 serialize 후 `generateCompletion` 호출
- [ ] JSON schema 검증(예: zod) 추가 고려
- [ ] Fallback 파서와의 인터페이스 정리

