# Step3 Structure Output Requirements

## 1. Goal
- Ensure Step3 LLM responses produce structured JSON data that directly maps to Step3 UI, Step4, and Step5 expectations without relying on brittle text parsing.
- Document schema expectations, required fields, and fallback behavior to maintain a reliable pipeline.

## 2. JSON Schema Overview
- The JSON contains explicit sections, components, images, interactions, and visual guidelines.
- Every field must be provided in a format that maps cleanly to `Step3IntegratedResult` and downstream data types.

### Key sections of the schema
```
{
  "page": {...},
  "sections": [...],
  "components": [...],
  "images": [...],
  "interactions": [...],
  "layoutGuidelines": {...},
  "styleGuidelines": [...],
  "typography": {...},
  "accessibility": [...],
  "objectives": [...],
  "keyPoints": [...],
  "callToAction": "...",
  "implementationHints": [...],
  "uxConsiderations": [...],
  "quality": {...}
}
```

- Sections align with `Step3Section` (ID, role, description, layout data, transitions, component refs).
- Components align with `ComponentSpec` mapped to Step3 `ComponentLine`.
- Images include alt/caption/purpose/placement so Step4 can plan assets and Step5 can generate prompts.
- Interactions include trigger/action/purpose/feedback for Step4 interaction design and Step5 prompts.
- Visual layout/style/typography/accessibility guidelines inform Step4+Step5 prompt generation.
- Objectives, key points, call-to-action feed Step4 detailed specs and Step5 final prompt.

## 3. Downstream Mapping
| JSON Section | Step3 UI | Step4 Needs | Step5 Needs |
|--------------|-----------|-------------|-------------|
| page.summary | Step3 markdown view | Step4 prompt | Step5 prompt context |
| sections | Step3 section cards | Step4 layout refinement | Step5 layout narrative |
| components | Step3 component count group | Step4 component style engine | Step5 detail bullet |
| images | Step3 image cards | Step4 image placement engine | Step5 image prompt list |
| interactions | Step3 activity list | Step4 interaction design engine | Step5 activity prompts |
| layout/style/typography/accessibility | Step3 summary tooltip (future) | Step4 prompt builder | Step5 quality narrative |
| objectives/keyPoints/callToAction | Step3 summary panels | Step4 & Step5 text |

## 4. Failure Handling
1. First attempt (function call JSON) → Use as-is.
2. JSON missing → optional re-ask to convert text.
3. Still failing → fallback text parser with warning; Step3 UI marks page as fallback.
4. Missing optional fields → fill defaults (e.g. dummy section) but log gaps.
5. Always capture `debugInfo.parsedSections.format` to track source.

## 5. Implementation Notes
- `OpenAIService.generateStructuredCompletion` requests function call with schema and enforces `tool_choice`.
- `EducationalDesignService` first attempts structured JSON; fallback to text parser only when JSON unavailable.
- `convertStructuredResponseToEducationalDesign` translates JSON to `EducationalPageDesign` with safe defaults.
- Step4 and Step5 benefit from consistent data; later improvements can rely on structured pipeline.

