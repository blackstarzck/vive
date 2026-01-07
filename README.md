# 🌊 Vive

Vive는 **Next.js 16 (App Router)**과 **Supabase**를 기반으로 구축된 최신 웹 애플리케이션입니다. 고성능의 현대적인 웹 경험을 제공하기 위해 설계되었으며, OpenAI API 연동을 통한 지능형 기능과 Tailwind CSS v4를 활용한 미려한 디자인을 특징으로 합니다.

## ✨ 주요 기능 (Key Features)

*   **🔐 Supabase 기반 인증 및 보안**: 이메일/비밀번호 기반의 인증 시스템과 `@supabase/ssr`을 활용한 서버 사이드 세션 관리를 지원합니다.
*   **📂 효율적인 데이터베이스 관리**: Supabase PostgreSQL을 활용하여 데이터를 저장하고 관리합니다.
*   **🤖 OpenAI API 연동**: OpenAI SDK를 통해 텍스트 생성, 요약 및 다양한 AI 기능을 서버리스 환경에서 제공합니다.
*   **🎨 모던한 UI/UX**:
    *   **Tailwind CSS v4**: 최신 유틸리티 클래스를 사용한 고도로 최적화된 스타일링.
    *   **Radix UI**: 접근성이 뛰어난 UI 프리미티브 사용.
    *   **다크 모드**: `next-themes`를 활용한 완벽한 다크/라이트 모드 테마 지원.
*   **📝 강력한 폼 처리**: React Hook Form과 Zod 스키마 검증을 통한 안전한 데이터 입력 처리.
*   **🔔 실시간 알림**: Sonner 라이브러리를 사용한 직관적인 토스트 메시지 시스템.

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: [Next.js 16.1 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), `clsx`, `tailwind-merge`, `tw-animate-css`
- **UI Components**: [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Icons)
- **State Management & Forms**: React Hook Form, Zod, `@hookform/resolvers`

### Backend & AI
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **AI Integration**: [OpenAI SDK](https://openai.com/)
- **API**: Next.js API Routes (Route Handlers)

### Utilities
- **Toast**: Sonner
- **Theme**: next-themes
- **Env**: Dotenv

## 🚀 시작하기 (Getting Started)

### 1. 저장소 클론 및 패키지 설치

```bash
git clone https://github.com/your-username/vive.git
cd vive
npm install
```

### 2. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래의 변수들을 설정합니다.

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # 서버 사이드 전용 (보안 주의)

# AI 설정
OPENAI_API_KEY=your_openai_api_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## 📂 프로젝트 구조 (Project Structure)

```text
src/
├── app/            # App Router 페이지 및 레이아웃
│   ├── (auth)/     # 인증 관련 그룹 (Login, Register)
│   ├── (main)/     # 메인 서비스 그룹 (Dashboard, Highlights, Settings 등)
│   ├── api/        # Route Handlers (AI, Auth, Books, Notion 연동 등)
│   └── globals.css # 글로벌 스타일링 (Tailwind v4)
├── components/     # 컴포넌트 라이브러리
│   ├── ui/         # Radix UI 기반 기본 컴포넌트 (Button, Input, Dialog 등)
│   ├── layout/     # Sidebar, Header, MainLayout 등 구조 컴포넌트
│   └── highlights/ # Highlight 관련 기능 컴포넌트
├── lib/            # 유틸리티 및 설정 (Supabase Client, OpenAI Client 등)
├── types/          # 공통 타입 및 Database 타입 정의
└── middleware.ts   # 인증 가드 및 세션 관리 미들웨어

supabase/
└── migrations/     # SQL 마이그레이션 파일 (Schema, Tables)
```