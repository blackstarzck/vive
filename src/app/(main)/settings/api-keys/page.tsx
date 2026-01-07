"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Key, Calendar, Shield, AlertCircle, Check, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

// Define the type locally to ensure we have exactly what we need for the UI
// based on the src/types/database.ts
interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface CreateKeyResponse {
  data: ApiKey & { key: string }; // The full key is only returned on creation
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  
  // New key form state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [newKeyExpiresIn, setNewKeyExpiresIn] = useState<string>("never"); // "never", "30", "60", "90"
  const [isCreating, setIsCreating] = useState(false);

  // Success dialog state
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/keys");
      if (!response.ok) throw new Error("API 키를 불러오는데 실패했습니다.");
      const data = await response.json();
      // Ensure we're setting an array, handling potential wrapper object { data: [...] }
      setKeys(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("API 키 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("키 이름을 입력해주세요.");
      return;
    }

    if (newKeyScopes.length === 0) {
      toast.error("최소 하나의 권한을 선택해주세요.");
      return;
    }

    try {
      setIsCreating(true);
      const payload: any = {
        name: newKeyName,
        scopes: newKeyScopes,
      };

      if (newKeyExpiresIn !== "never") {
        payload.expiresInDays = parseInt(newKeyExpiresIn);
      }

      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API 키 생성에 실패했습니다.");

      const result = await response.json();
      
      setCreatedKey(result.key);
      setIsCreateDialogOpen(false);
      setIsSuccessDialogOpen(true);
      fetchKeys(); // Refresh list
      
      // Reset form
      setNewKeyName("");
      setNewKeyScopes(["read"]);
      setNewKeyExpiresIn("never");
    } catch (error) {
      console.error(error);
      toast.error("API 키를 생성하지 못했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      const response = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyToDelete }),
      });

      if (!response.ok) throw new Error("API 키 삭제에 실패했습니다.");

      toast.success("API 키가 삭제되었습니다.");
      fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error("API 키를 삭제하지 못했습니다.");
    } finally {
      setIsDeleteDialogOpen(false);
      setKeyToDelete(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success("클립보드에 복사되었습니다.");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "사용 기록 없음";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "방금 전";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">API 키 관리</h2>
          <p className="text-muted-foreground">
            외부 애플리케이션에서 계정에 접근할 수 있는 API 키를 관리합니다.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          새 키 생성
        </Button>
      </div>

      {/* Keys List */}
      <div className="grid gap-4">
        {isLoading ? (
          // Loading Skeletons
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 w-1/3 bg-muted rounded mb-2" />
                <div className="h-4 w-1/4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-10 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : keys.length === 0 ? (
          // Empty State
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Key className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">생성된 API 키가 없습니다</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                API 키를 생성하여 외부 서비스나 스크립트에서 계정에 안전하게 접근하세요.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                첫 API 키 생성하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Keys List
          keys.map((key) => (
            <Card key={key.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{key.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono mt-0.5">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs border">
                          {key.key_prefix}
                        </span>
                        <span>••••••••••••</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {key.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="capitalize">
                        {scope === "read" ? "읽기" : scope === "write" ? "쓰기" : scope === "delete" ? "삭제" : scope}
                      </Badge>
                    ))}
                    {key.expires_at && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {formatDate(key.expires_at)} 만료
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-1 text-sm text-muted-foreground min-w-[140px]">
                  <div className="flex items-center gap-1.5" title="생성일">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(key.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="마지막 사용">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{formatRelativeTime(key.last_used_at)}</span>
                  </div>
                  
                  <div className="mt-2 sm:mt-4 w-full sm:w-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto justify-start sm:justify-center"
                      onClick={() => {
                        setKeyToDelete(key.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">삭제</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 API 키 생성</DialogTitle>
            <DialogDescription>
              API 키의 이름과 권한을 설정하세요. 키는 생성 직후 한 번만 보여집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="예: 내 블로그 연동"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>권한 (Scopes)</Label>
              <div className="flex gap-2">
                {["read", "write", "delete"].map((scope) => (
                  <Button
                    key={scope}
                    type="button"
                    variant={newKeyScopes.includes(scope) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleScope(scope)}
                    className="flex-1"
                  >
                    {scope === "read" ? "읽기" : scope === "write" ? "쓰기" : "삭제"}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                키가 수행할 수 있는 작업을 선택하세요. 최소 하나 이상 선택해야 합니다.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiration">만료 기간</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={newKeyExpiresIn === "never" ? "secondary" : "outline"}
                  onClick={() => setNewKeyExpiresIn("never")}
                  className={newKeyExpiresIn === "never" ? "border-primary border" : ""}
                >
                  만료 없음
                </Button>
                <div className="grid grid-cols-3 gap-1">
                  {["30", "60", "90"].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant={newKeyExpiresIn === days ? "secondary" : "outline"}
                      onClick={() => setNewKeyExpiresIn(days)}
                      className={`text-xs ${newKeyExpiresIn === days ? "border-primary border" : ""}`}
                    >
                      {days}일
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateKey} disabled={isCreating}>
              {isCreating ? "생성 중..." : "생성하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => !open && setIsSuccessDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              API 키 생성 완료
            </DialogTitle>
            <DialogDescription>
              이 키는 다시 확인할 수 없습니다. 지금 안전한 곳에 복사해 두세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="link"
                  defaultValue={createdKey || ""}
                  readOnly
                  className="pr-10 font-mono text-sm bg-muted"
                />
              </div>
            </div>
            <Button size="icon" onClick={() => createdKey && copyToClipboard(createdKey)} className="shrink-0">
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm dark:bg-yellow-900/30 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>이 창을 닫으면 키 전체를 다시 볼 수 없습니다. 키를 잃어버리면 새로 생성해야 합니다.</p>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              확인했습니다, 닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API 키 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 이 키를 사용하는 모든 애플리케이션의 연결이 끊어집니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
