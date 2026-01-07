# Vive

이 프로젝트는 **Next.js 16**과 **Supabase**를 기반으로 구축된 최신 웹 애플리케이션입니다.

## 🛠 기술 스택 (Tech Stack)

### Core
- **Framework**: [Next.js 16.1](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), Shadcn UI 기반 (추정)

### Backend & Database
- **Platform**: [Supabase](https://supabase.com/) (Database, Authentication, Storage)
- **Client**: `@supabase/supabase-js`, `@supabase/ssr`

### Tools & Libraries
- **Forms**: React Hook Form, Zod
- **AI**: OpenAI SDK
- **Icons**: Lucide React
- **Utilities**: `clsx`, `tailwind-merge`

## 🚀 시작하기 (Getting Started)

### 1. 의존성 설치

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 필요한 환경 변수를 설정해야 합니다.
(예: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.
 `app/page.tsx` 파일을 수정하여 페이지 편집을 시작할 수 있습니다.

## 📂 프로젝트 구조

- `src/`: 소스 코드 디렉토리
- `supabase/`: Supabase 관련 설정
- `public/`: 정적 파일
