-- =============================================
-- Notion Integrations Table
-- 사용자별 Notion 연동 정보 저장
-- =============================================

-- notion_integrations 테이블 생성
CREATE TABLE IF NOT EXISTS notion_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notion API 정보
    access_token TEXT NOT NULL,  -- 암호화되어 저장됨 (Notion Internal Integration Token)
    
    -- 동기화 대상 데이터베이스
    database_id TEXT,  -- Notion Database ID (선택적)
    database_name TEXT,  -- 사용자가 보기 쉽게 저장
    
    -- 동기화 설정
    sync_enabled BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT false,  -- 하이라이트 추가 시 자동 동기화
    last_synced_at TIMESTAMPTZ,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 한 사용자당 하나의 Notion 연동만 허용
    UNIQUE(user_id)
);

-- notion_sync_logs 테이블 (동기화 기록)
CREATE TABLE IF NOT EXISTS notion_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES notion_integrations(id) ON DELETE CASCADE,
    
    -- 동기화 정보
    sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'auto', 'initial')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- 결과
    highlights_synced INTEGER DEFAULT 0,
    errors JSONB,
    
    -- 시간 정보
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 하이라이트별 Notion 페이지 매핑 테이블
CREATE TABLE IF NOT EXISTS highlight_notion_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notion 페이지 정보
    notion_page_id TEXT NOT NULL,
    notion_page_url TEXT,
    
    -- 동기화 정보
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 하이라이트당 하나의 Notion 페이지만
    UNIQUE(highlight_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notion_integrations_user_id ON notion_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_sync_logs_user_id ON notion_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_sync_logs_integration_id ON notion_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_highlight_notion_pages_highlight_id ON highlight_notion_pages(highlight_id);
CREATE INDEX IF NOT EXISTS idx_highlight_notion_pages_user_id ON highlight_notion_pages(user_id);

-- RLS 활성화
ALTER TABLE notion_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_notion_pages ENABLE ROW LEVEL SECURITY;

-- notion_integrations RLS 정책
CREATE POLICY "Users can view own notion integrations"
    ON notion_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notion integrations"
    ON notion_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notion integrations"
    ON notion_integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notion integrations"
    ON notion_integrations FOR DELETE
    USING (auth.uid() = user_id);

-- notion_sync_logs RLS 정책
CREATE POLICY "Users can view own sync logs"
    ON notion_sync_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
    ON notion_sync_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- highlight_notion_pages RLS 정책
CREATE POLICY "Users can view own highlight notion pages"
    ON highlight_notion_pages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlight notion pages"
    ON highlight_notion_pages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlight notion pages"
    ON highlight_notion_pages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlight notion pages"
    ON highlight_notion_pages FOR DELETE
    USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER update_notion_integrations_updated_at
    BEFORE UPDATE ON notion_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlight_notion_pages_updated_at
    BEFORE UPDATE ON highlight_notion_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
