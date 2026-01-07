"use client";

import { useEffect, useState } from "react";
import { 
  Database, 
  Link2, 
  Unlink, 
  RefreshCw, 
  Settings, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Plus,
  History,
  Loader2,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NotionIntegration, NotionSyncLog } from "@/types/database";

// Types for API responses
interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

interface NotionPage {
  id: string;
  title: string;
  url: string;
}

export default function NotionSettingsPage() {
  const [integration, setIntegration] = useState<NotionIntegration | null>(null);
  const [syncLogs, setSyncLogs] = useState<NotionSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Connection state
  const [accessToken, setAccessToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Database configuration state
  const [availableDatabases, setAvailableDatabases] = useState<NotionDatabase[]>([]);
  const [availablePages, setAvailablePages] = useState<NotionPage[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Dialogs
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isDbDialogOpen, setIsDbDialogOpen] = useState(false);

  useEffect(() => {
    fetchIntegration();
  }, []);

  useEffect(() => {
    if (integration) {
      fetchSyncLogs();
      const interval = setInterval(fetchSyncLogs, 10000); // Poll logs every 10s
      return () => clearInterval(interval);
    }
  }, [integration]);

  const fetchIntegration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/integrations/notion");
      if (response.status === 404) {
        setIntegration(null);
        return;
      }
      if (!response.ok) throw new Error("Notion 연동 정보를 불러오는데 실패했습니다.");
      
      const data = await response.json();
      // API returns { data: integration } or { data: null }
      // We need to explicitly check if data.data exists and is not null
      const integrationData = data.data;
      setIntegration(integrationData ?? null);
    } catch (error) {
      console.error(error);
      // Don't toast on initial 404/error to avoid spamming if not connected
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const response = await fetch("/api/integrations/notion/sync");
      if (!response.ok) return;
      const data = await response.json();
      setSyncLogs(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const handleConnect = async () => {
    if (!accessToken.trim()) {
      toast.error("통합 토큰을 입력해주세요.");
      return;
    }

    try {
      setIsConnecting(true);
      // 1. Validate token first
      const validateRes = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", access_token: accessToken }),
      });

      if (!validateRes.ok) throw new Error("유효하지 않은 토큰입니다.");

      // 2. Save integration
      const saveRes = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!saveRes.ok) throw new Error("연동 정보를 저장하는데 실패했습니다.");

      toast.success("Notion과 성공적으로 연결되었습니다.");
      setAccessToken("");
      
      // Refresh integration data
      await fetchIntegration();
      
      // Open DB configuration immediately
      fetchDatabasesAndPages();
      setIsDbDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "연동에 실패했습니다.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const response = await fetch("/api/integrations/notion", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("연동 해제에 실패했습니다.");

      setIntegration(null);
      setSyncLogs([]);
      setIsDisconnectDialogOpen(false);
      toast.success("Notion 연동이 해제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("연동 해제 중 오류가 발생했습니다.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const fetchDatabasesAndPages = async () => {
    try {
      setIsLoadingDatabases(true);
      
      // Fetch Databases
      const dbRes = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_databases" }),
      });
      if (dbRes.ok) {
        const result = await dbRes.json();
        setAvailableDatabases(result.data || result || []);
      }

      // Fetch Pages (for creating new DB)
      const pageRes = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_pages" }),
      });
      if (pageRes.ok) {
        const result = await pageRes.json();
        setAvailablePages(result.data || result || []);
      }
    } catch (error) {
      console.error("Failed to fetch Notion resources", error);
      toast.error("Notion 데이터베이스 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const handleSelectDatabase = async (dbId: string, dbName: string) => {
    try {
      setIsConfiguring(true);
      const response = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "set_database", 
          database_id: dbId,
          database_name: dbName 
        }),
      });

      if (!response.ok) throw new Error("데이터베이스 설정에 실패했습니다.");

      await fetchIntegration();
      toast.success(`'${dbName}' 데이터베이스가 선택되었습니다.`);
      setIsDbDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("데이터베이스 설정 중 오류가 발생했습니다.");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!selectedPageId) {
      toast.error("데이터베이스를 생성할 페이지를 선택해주세요.");
      return;
    }

    try {
      setIsConfiguring(true);
      const response = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create_database", 
          parent_page_id: selectedPageId 
        }),
      });

      if (!response.ok) throw new Error("데이터베이스 생성에 실패했습니다.");

      await fetchIntegration();
      toast.success("새로운 VIVE 하이라이트 데이터베이스가 생성되었습니다.");
      setIsDbDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("데이터베이스 생성 중 오류가 발생했습니다.");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      toast.info("동기화를 시작합니다...");
      
      const response = await fetch("/api/integrations/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_all: true }),
      });

      if (!response.ok) throw new Error("동기화 시작에 실패했습니다.");

      toast.success("동기화가 백그라운드에서 시작되었습니다.");
      // Refresh logs immediately
      setTimeout(fetchSyncLogs, 1000);
    } catch (error) {
      console.error(error);
      toast.error("동기화 요청 실패");
      setIsSyncing(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<NotionIntegration>) => {
    try {
      const response = await fetch("/api/integrations/notion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("설정 업데이트 실패");

      await fetchIntegration();
      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("설정을 변경하지 못했습니다.");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4 animate-pulse">
        <div className="h-8 w-1/3 bg-muted rounded" />
        <div className="h-64 w-full bg-muted rounded" />
      </div>
    );
  }

  // State 1: Not Connected
  if (!integration) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Notion 연동</h2>
          <p className="text-muted-foreground">
            독서 하이라이트를 Notion 데이터베이스와 자동으로 동기화하세요.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full border rounded-lg px-4">
          <AccordionItem value="guide" className="border-b-0">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                연동 설정 가이드 (필독)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4 pt-2">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                  Notion 통합 생성
                </h4>
                <p className="pl-7">
                  <a href="https://www.notion.so/my-integrations" target="_blank" className="text-primary hover:underline font-medium">Notion 통합 설정</a>에서 새 통합을 만드세요.
                  기본 권한(읽기/업데이트/삽입)이 모두 체크되어야 합니다.
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                  페이지 연결 (가장 중요!)
                </h4>
                <div className="pl-7 space-y-2">
                  <p>
                    하이라이트를 저장할 Notion 페이지로 이동하여 우측 상단 <strong>...</strong> 메뉴 &gt; <strong>연결(Connections)</strong>에서 방금 만든 통합을 추가하세요.
                  </p>
                  <p className="text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    이 작업을 하지 않으면 VIVE가 페이지를 찾을 수 없습니다.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                  데이터베이스 설정
                </h4>
                <p className="pl-7">
                  연동 후 '새로 만들기'를 추천합니다. 기존 DB를 쓸 경우 필요한 속성(ViveId 등)이 자동으로 추가됩니다.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              Notion 계정 연결
            </CardTitle>
            <CardDescription>
              Notion 통합 토큰을 입력하여 시작하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">내부 통합 토큰 (Internal Integration Token)</Label>
              <Input
                id="token"
                type="password"
                placeholder="secret_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
                <p className="font-medium text-foreground">토큰 발급 방법:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li><a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Notion 내 통합 설정<ExternalLink className="w-3 h-3"/></a>으로 이동합니다.</li>
                  <li>"새 통합 만들기"를 클릭합니다.</li>
                  <li>이름(예: VIVE Sync)을 입력하고 "제출"을 클릭합니다.</li>
                  <li>"내부 통합 시크릿"을 복사하여 위 칸에 붙여넣으세요.</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleConnect} 
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  연결 확인 중...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Notion 연결하기
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // State 2: Connected
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Notion 연동 설정</h2>
          <p className="text-muted-foreground">
            연결된 Notion 계정 및 동기화 상태를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant={integration.sync_enabled ? "default" : "secondary"} className="text-sm px-3 py-1">
            {integration.sync_enabled ? "동기화 켜짐" : "동기화 일시중지됨"}
           </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          {/* Connection Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                연결됨
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-white border flex items-center justify-center">
                                      <img src="/notion-logo.svg" alt="Notion" className="w-5 h-5" onError={(e) => e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"} />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">Notion Integration</div>
                                      <div className="text-xs text-muted-foreground">
                                        연결됨 · {formatDate(integration.created_at)}
                                      </div>
                                    </div>
                                  </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setIsDisconnectDialogOpen(true)}
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card className={!integration.database_id ? "border-primary shadow-sm" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                동기화 데이터베이스
              </CardTitle>
              <CardDescription>
                하이라이트가 저장될 Notion 데이터베이스입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integration.database_id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium truncate text-primary">
                        {integration.database_name || "이름 없는 데이터베이스"}
                      </span>
                    </div>
                    {/* Note: We don't have the URL stored in the DB row usually, but if we did, we'd link it. 
                        Assuming we might not have it, we just show name. */}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      fetchDatabasesAndPages();
                      setIsDbDialogOpen(true);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    데이터베이스 변경
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-full w-fit mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-medium">데이터베이스가 선택되지 않았습니다</h4>
                  <p className="text-sm text-muted-foreground">
                    하이라이트를 저장하려면 데이터베이스를 연결해야 합니다.
                  </p>
                  <Button 
                    onClick={() => {
                      fetchDatabasesAndPages();
                      setIsDbDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    데이터베이스 설정하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

           {/* Sync Controls */}
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                동기화 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">자동 동기화</Label>
                  <p className="text-sm text-muted-foreground">
                    새 하이라이트가 추가될 때마다 Notion에 자동으로 저장합니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={integration.auto_sync ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateSettings({ auto_sync: !integration.auto_sync })}
                  >
                    {integration.auto_sync ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>수동 동기화</Label>
                  <p className="text-xs text-muted-foreground">
                    모든 하이라이트를 즉시 동기화합니다.
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={isSyncing || !integration.database_id}
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  지금 동기화
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Logs */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                동기화 기록
              </CardTitle>
              <CardDescription>
                최근 동기화 작업 내역입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[600px] pr-2">
              <div className="space-y-4">
                {syncLogs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    기록이 없습니다.
                  </div>
                ) : (
                  syncLogs.map((log) => (
                    <div key={log.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30 border text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              log.status === "completed" ? "default" : 
                              log.status === "failed" ? "destructive" : 
                              log.status === "in_progress" ? "secondary" : "outline"
                            }
                            className={`
                              ${log.status === "completed" ? "bg-green-600 hover:bg-green-700" : ""}
                              ${log.status === "in_progress" ? "animate-pulse" : ""}
                            `}
                          >
                            {log.status === "completed" && "완료"}
                            {log.status === "failed" && "실패"}
                            {log.status === "in_progress" && "진행 중"}
                            {log.status === "pending" && "대기 중"}
                          </Badge>
                          <span className="font-medium">
                            {log.sync_type === "auto" ? "자동 동기화" : 
                             log.sync_type === "manual" ? "수동 동기화" : "초기 설정"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDate(log.started_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground px-1">
                        <span>{log.highlights_synced}개 항목 처리됨</span>
                        {log.completed_at && (
                          <span className="text-xs">
                             소요시간: {((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1)}초
                          </span>
                        )}
                      </div>
                      {log.errors && (
                         <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-xs rounded break-all font-mono">
                           {JSON.stringify(log.errors).slice(0, 100)}...
                         </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Database Selection Dialog */}
      <Dialog open={isDbDialogOpen} onOpenChange={setIsDbDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>데이터베이스 설정</DialogTitle>
            <DialogDescription>
              하이라이트를 저장할 Notion 데이터베이스를 선택하거나 새로 생성하세요.
              <br />
              <span className="text-xs text-red-500 font-medium mt-1 block">
                * 목록에 페이지나 데이터베이스가 보이지 않나요? 
                Notion 페이지 우측 상단 메뉴 &gt; 연결(Connections)에서 통합을 추가했는지 꼭 확인하세요.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="select" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">기존 데이터베이스 선택</TabsTrigger>
              <TabsTrigger value="create">새로 만들기</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="space-y-4 py-4">
              {isLoadingDatabases ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : availableDatabases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>연결된 데이터베이스가 없습니다.</p>
                  <p className="text-xs mt-2">Notion 페이지에 통합을 초대한 후 '새로고침' 하세요.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={fetchDatabasesAndPages}>
                    <RefreshCw className="w-3 h-3 mr-2" /> 목록 새로고침
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                  <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-2">
                    * 기존 데이터베이스 선택 시, VIVE 동기화에 필요한 속성(컬럼)이 자동으로 추가됩니다.
                  </div>
                  {availableDatabases.map(db => (
                    <div 
                      key={db.id}
                      onClick={() => setSelectedDatabaseId(db.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all
                        ${selectedDatabaseId === db.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}
                      `}
                    >
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium truncate">{db.title || "제목 없음"}</div>
                      </div>
                      {selectedDatabaseId === db.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  ))}
                </div>
              )}
              <Button 
                onClick={() => {
                   const db = availableDatabases.find(d => d.id === selectedDatabaseId);
                   if (db) handleSelectDatabase(db.id, db.title);
                }} 
                disabled={!selectedDatabaseId || isConfiguring}
                className="w-full"
              >
                {isConfiguring ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                선택한 데이터베이스 사용
              </Button>
            </TabsContent>

            <TabsContent value="create" className="space-y-4 py-4">
              <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>생성 위치 (상위 페이지)</Label>
                   {isLoadingDatabases ? (
                      <div className="h-10 w-full bg-muted rounded animate-pulse" />
                   ) : availablePages.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-3 border border-dashed rounded bg-muted/30">
                        접근 가능한 페이지가 없습니다. 통합을 페이지에 추가해주세요.
                      </div>
                   ) : (
                      <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                        {availablePages.map(page => (
                          <div 
                            key={page.id}
                            onClick={() => setSelectedPageId(page.id)}
                            className={`
                              flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all
                              ${selectedPageId === page.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}
                            `}
                          >
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium truncate">{page.title || "제목 없음"}</div>
                            </div>
                            {selectedPageId === page.id && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        ))}
                      </div>
                   )}
                 </div>
                 <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                   <p className="font-medium mb-1">* 선택한 페이지 하위에 'VIVE 독서 하이라이트' 데이터베이스가 자동 생성됩니다.</p>
                   <p>필요한 모든 속성(제목, 저자, 메모, 태그 등)이 자동으로 설정되므로 가장 추천하는 방식입니다.</p>
                 </div>
              </div>
              <Button 
                onClick={handleCreateDatabase} 
                disabled={!selectedPageId || isConfiguring}
                className="w-full"
              >
                {isConfiguring ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                새 데이터베이스 생성
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Disconnect Alert */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notion 연동 해제</DialogTitle>
            <DialogDescription>
              정말로 연동을 해제하시겠습니까? 더 이상 하이라이트가 동기화되지 않습니다.
              이미 동기화된 데이터는 Notion에 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(false)}>취소</Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "해제 중..." : "연동 해제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
