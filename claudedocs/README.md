# 교안 프롬프트 생성기 MVP - Design Documentation

## 📋 Overview
OpenAI GPT-5 API를 활용하여 Claude Code용 교안 개발 프롬프트를 자동 생성하는 웹 애플리케이션 설계 문서입니다.

## 🎯 Core Features
- ✅ OpenAI API 키 관리 (로컬스토리지 암호화 저장)
- ✅ 교안 정보 입력 폼 (주제, 대상, 페이지별 내용)
- ✅ GPT-5 기반 프롬프트 자동 생성
- ✅ 생성된 프롬프트 표시, 복사, 다운로드

## 📁 Design Documents

### 1. [System Design](./system-design.md)
- System architecture diagram
- Component hierarchy
- Data flow patterns
- State management structure
- Security considerations
- Performance optimizations

### 2. [Component Specifications](./component-specs.md)
- Detailed component implementations
- Service layer architecture
- Custom hooks design
- Type definitions
- Code examples for all major components

### 3. [Implementation Roadmap](./implementation-roadmap.md)
- 6-hour MVP development timeline
- Step-by-step implementation guide
- Setup instructions
- Testing strategy
- Deployment configuration
- Post-MVP enhancement plan

## 🛠 Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **API**: OpenAI GPT-5
- **Build**: Vite
- **Storage**: LocalStorage with CryptoJS encryption

## 🚀 Quick Start

### Development Setup
```bash
# Clone and setup
cd promptgen
npm create vite@latest . -- --template react-ts
npm install

# Install dependencies
npm install openai tailwindcss crypto-js clsx
npm install -D @types/crypto-js

# Start development
npm run dev
```

### Implementation Order
1. **Phase 1**: Project setup (30 min)
2. **Phase 2**: Core services (1 hour)
3. **Phase 3**: Components (2 hours)
4. **Phase 4**: Integration (1 hour)
5. **Phase 5**: Testing (1 hour)
6. **Phase 6**: Deployment (30 min)

## 📊 MVP Success Metrics
- ⚡ Initial load < 3 seconds
- 🔄 API response < 10 seconds
- 📦 Bundle size < 500KB
- ✅ TypeScript strict mode compliance
- 🧪 Test coverage > 80%

## 🔐 Security Features
- API key encryption in localStorage
- Input sanitization
- XSS prevention
- Rate limiting implementation

## 📈 Future Enhancements
- Prompt template library
- Multi-language support
- Backend API server
- User authentication system
- Team collaboration features

## 💡 Key Design Decisions

### 1. Browser-side API Calls
- **Decision**: Use `dangerouslyAllowBrowser: true` for OpenAI client
- **Rationale**: MVP simplicity, no backend required
- **Trade-off**: Security vs. deployment complexity

### 2. LocalStorage for Persistence
- **Decision**: Encrypt API keys with CryptoJS
- **Rationale**: Simple persistence without backend
- **Trade-off**: Limited security vs. user convenience

### 3. Single Page Application
- **Decision**: All functionality in one page with state-based navigation
- **Rationale**: Simplified UX for MVP
- **Trade-off**: Limited routing vs. development speed

## 📝 Notes for Implementation

### Critical Path
1. API key validation must work before any other feature
2. Form validation is essential for good UX
3. Error handling must be comprehensive
4. Copy functionality is core to user workflow

### Testing Priority
1. API key validation
2. Form submission flow
3. Prompt generation
4. Copy/download features

### Performance Considerations
- Debounce form inputs (500ms)
- Throttle auto-save (2 seconds)
- Cache API responses where possible
- Lazy load components

## 🎯 Deliverables Checklist
- [x] System architecture design
- [x] Component specifications
- [x] Service layer design
- [x] Data flow documentation
- [x] Implementation roadmap
- [x] Deployment strategy
- [x] Testing approach
- [x] Security considerations

---

*Design completed: 2025-09-09*
*Ready for implementation phase*