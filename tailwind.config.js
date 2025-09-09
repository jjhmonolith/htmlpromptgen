/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Apple 색상 시스템
      colors: {
        apple: {
          blue: '#007AFF',
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
          pink: '#FF2D92',
          yellow: '#FFCC00',
          gray: {
            1: '#F2F2F7',
            2: '#E5E5EA',
            3: '#D1D1D6',
            4: '#C7C7CC',
            5: '#AEAEB2',
            6: '#8E8E93',
            7: '#636366',
            8: '#48484A',
            9: '#3A3A3C',
          }
        }
      },
      // Apple 타이포그래피
      fontSize: {
        'display-large': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-medium': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-small': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
        'headline-large': ['1.5rem', { lineHeight: '1.3', fontWeight: '500' }],
        'headline-medium': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'headline-small': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-large': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-small': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.3', fontWeight: '400' }],
      },
      // Apple 그리드 시스템
      gridTemplateColumns: {
        'apple-12': 'repeat(12, 1fr)',
        'apple-8': 'repeat(8, 1fr)',
        'apple-6': 'repeat(6, 1fr)',
        'apple-4': 'repeat(4, 1fr)',
        'apple-2': 'repeat(2, 1fr)',
      },
      // Apple 둥근 모서리
      borderRadius: {
        'apple-xs': '8px',
        'apple-sm': '12px',
        'apple-md': '16px',
        'apple-lg': '20px',
        'apple-xl': '24px',
        'apple-2xl': '32px',
      },
      // Apple 그림자 시스템
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'apple-md': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'apple-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'apple-xl': '0 16px 48px rgba(0, 0, 0, 0.15)',
        'apple-2xl': '0 24px 64px rgba(0, 0, 0, 0.18)',
      },
      // Apple 간격 시스템
      spacing: {
        'apple-xs': '4px',
        'apple-sm': '8px',
        'apple-md': '16px',
        'apple-lg': '24px',
        'apple-xl': '32px',
        'apple-2xl': '48px',
        'apple-3xl': '64px',
      },
      // Apple 애니메이션
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        'apple': '300ms',
      },
      // 컨테이너 최대 너비
      maxWidth: {
        'apple-container': '1400px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}