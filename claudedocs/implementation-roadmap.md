# Implementation Roadmap

## Phase 1: Project Setup (30 minutes)

### 1.1 Initialize Project
```bash
# Create project with Vite
npm create vite@latest promptgen -- --template react-ts
cd promptgen

# Install dependencies
npm install openai
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install crypto-js
npm install clsx

# Install dev dependencies
npm install -D @types/crypto-js
npm install -D prettier eslint-config-prettier
```

### 1.2 Configure Tailwind CSS
```bash
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 1.3 Setup TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Phase 2: Core Services Implementation (1 hour)

### 2.1 Create Type Definitions
- [ ] Create `src/types/course.types.ts`
- [ ] Create `src/types/api.types.ts`
- [ ] Create `src/types/index.ts` (barrel export)

### 2.2 Implement Storage Service
- [ ] Create `src/services/storage.service.ts`
- [ ] Implement API key encryption/decryption
- [ ] Implement draft management functions
- [ ] Add localStorage utilities

### 2.3 Implement OpenAI Service
- [ ] Create `src/services/openai.service.ts`
- [ ] Implement singleton pattern
- [ ] Add API key validation
- [ ] Create client initialization

### 2.4 Implement Prompt Generator
- [ ] Create `src/services/prompt.generator.ts`
- [ ] Design prompt template structure
- [ ] Implement GPT-5 integration
- [ ] Add error handling

## Phase 3: Component Development (2 hours)

### 3.1 Common Components
```tsx
// src/components/common/Button.tsx
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className,
  children,
  ...props 
}) => {
  return (
    <button
      className={clsx(
        'font-medium rounded-lg transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-green-600 text-white': variant === 'success',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 3.2 ApiKeyManager Component
- [ ] Create component structure
- [ ] Implement validation flow
- [ ] Add loading states
- [ ] Handle error cases

### 3.3 CourseForm Component
- [ ] Create main form component
- [ ] Implement PageEditor sub-component
- [ ] Add form validation
- [ ] Implement auto-save functionality

### 3.4 ResultDisplay Component
- [ ] Create display component
- [ ] Implement PromptViewer
- [ ] Add copy functionality
- [ ] Add download feature

## Phase 4: Application Integration (1 hour)

### 4.1 Main App Component
```tsx
// src/App.tsx
import { useState } from 'react';
import { ApiKeyManager } from './components/ApiKeyManager';
import { CourseForm } from './components/CourseForm';
import { ResultDisplay } from './components/ResultDisplay';
import { usePromptGenerator } from './hooks/usePromptGenerator';
import { CourseFormData } from './types/course.types';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const { generatePrompt, isGenerating, error } = usePromptGenerator();

  const handleKeyValidated = (key: string) => {
    setApiKey(key);
  };

  const handleFormSubmit = async (data: CourseFormData) => {
    if (!apiKey) return;
    
    try {
      const prompt = await generatePrompt(data, apiKey);
      setGeneratedPrompt(prompt);
      setMetadata({
        generatedAt: new Date(),
        subject: data.subject
      });
    } catch (err) {
      console.error('Failed to generate prompt:', err);
    }
  };

  const handleReset = () => {
    setGeneratedPrompt(null);
    setMetadata(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            교안 프롬프트 생성기
          </h1>
          <p className="text-gray-600 mt-2">
            Claude Code용 교안 개발 프롬프트를 자동으로 생성합니다
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {!apiKey ? (
            <ApiKeyManager onKeyValidated={handleKeyValidated} />
          ) : generatedPrompt ? (
            <ResultDisplay 
              prompt={generatedPrompt}
              metadata={metadata}
              onReset={handleReset}
            />
          ) : (
            <CourseForm 
              onSubmit={handleFormSubmit}
              isLoading={isGenerating}
            />
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
```

### 4.2 Custom Hooks
- [ ] Create `useApiKey` hook
- [ ] Create `useLocalStorage` hook
- [ ] Create `usePromptGenerator` hook
- [ ] Create `useDraft` hook

### 4.3 Utility Functions
- [ ] Create validators.ts
- [ ] Create formatters.ts
- [ ] Create constants.ts
- [ ] Create clipboard.ts

## Phase 5: Testing & Refinement (1 hour)

### 5.1 Unit Testing Setup
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
```

### 5.2 Test Coverage
- [ ] Service layer tests
- [ ] Component tests
- [ ] Hook tests
- [ ] Integration tests

### 5.3 Error Handling
- [ ] API error boundaries
- [ ] Network failure handling
- [ ] Rate limit management
- [ ] Validation error display

## Phase 6: Deployment (30 minutes)

### 6.1 Build Configuration
```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'openai': ['openai'],
          'crypto': ['crypto-js'],
        },
      },
    },
  },
});
```

### 6.2 Environment Variables
```bash
# .env.example
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=PromptGen
```

### 6.3 Deployment Steps
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Alternative: Deploy to Netlify**
   ```bash
   # netlify.toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

## Phase 7: Post-MVP Enhancements

### 7.1 Immediate Improvements (Week 1)
- [ ] Add prompt templates library
- [ ] Implement prompt history
- [ ] Add dark mode support
- [ ] Improve mobile responsiveness

### 7.2 Feature Additions (Week 2-3)
- [ ] Export to various formats (PDF, DOCX)
- [ ] Collaborative sharing features
- [ ] Prompt evaluation scoring
- [ ] Multi-language support

### 7.3 Advanced Features (Month 2)
- [ ] Backend API server
- [ ] User authentication
- [ ] Team workspaces
- [ ] Analytics dashboard
- [ ] AI model selection (GPT-4, Claude)

## Development Commands

```bash
# Development
npm run dev           # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run type-check   # Run TypeScript check

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run coverage     # Generate coverage report
```

## Success Metrics

### MVP Success Criteria
- [ ] API key validation works correctly
- [ ] Course form accepts all required inputs
- [ ] Prompt generation completes within 10 seconds
- [ ] Generated prompts are copyable
- [ ] Data persists across sessions
- [ ] Error states are handled gracefully

### Performance Targets
- Initial load: < 3 seconds
- API response: < 10 seconds
- Interaction response: < 100ms
- Bundle size: < 500KB

### Quality Metrics
- TypeScript strict mode: 100% compliance
- Test coverage: > 80%
- Lighthouse score: > 90
- Accessibility: WCAG 2.1 AA compliant

## Risk Mitigation

### Technical Risks
1. **API Rate Limiting**
   - Solution: Implement exponential backoff
   - Cache responses locally

2. **Browser API Key Storage**
   - Solution: Encrypt with CryptoJS
   - Warn users about security implications

3. **Large Response Handling**
   - Solution: Stream responses
   - Implement pagination for history

### Business Risks
1. **API Cost Management**
   - Monitor usage patterns
   - Implement usage limits
   - Consider backend proxy

2. **User Adoption**
   - Create tutorial videos
   - Provide example templates
   - Gather user feedback

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Setup | 30 min | Project initialized, dependencies installed |
| Services | 1 hour | Core services implemented |
| Components | 2 hours | All UI components complete |
| Integration | 1 hour | Full app working |
| Testing | 1 hour | Tests written, bugs fixed |
| Deployment | 30 min | App deployed to production |
| **Total** | **6 hours** | **MVP Complete** |

## Next Steps

1. **Immediate Actions**
   - Set up project repository
   - Install dependencies
   - Create component structure

2. **Development Priority**
   - Core services first
   - UI components second
   - Integration last

3. **Testing Strategy**
   - Test as you build
   - Focus on critical paths
   - Manual testing for UI/UX