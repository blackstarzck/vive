import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { ApiKey, ApiKeyScope } from "@/types/database";
import { NextRequest } from "next/server";

// Generate a secure random API key
export function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "vive_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Get the prefix (first 12 chars including "vive_")
export function getKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

// Hash the API key for storage
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify API key and return user info
export interface ApiKeyVerifyResult {
  valid: boolean;
  userId?: string;
  scopes?: ApiKeyScope[];
  error?: string;
}

export async function verifyApiKey(
  request: NextRequest,
  requiredScope?: ApiKeyScope
): Promise<ApiKeyVerifyResult> {
  // Extract API key from Authorization header
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header" };
  }

  // Support both "Bearer <key>" and just "<key>"
  let apiKey: string;
  if (authHeader.startsWith("Bearer ")) {
    apiKey = authHeader.substring(7);
  } else {
    apiKey = authHeader;
  }

  if (!apiKey.startsWith("vive_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const keyHash = await hashApiKey(apiKey);

    // Find the API key in database
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .single();

    if (error || !data) {
      return { valid: false, error: "Invalid API key" };
    }

    const keyData = data as ApiKey;

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Check scope
    const scopes = keyData.scopes as ApiKeyScope[];
    if (requiredScope && !scopes.includes(requiredScope)) {
      return {
        valid: false,
        error: `API key does not have '${requiredScope}' permission`,
      };
    }

    // Update last_used_at (fire and forget)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyData.id)
      .then(() => {});

    return {
      valid: true,
      userId: keyData.user_id,
      scopes,
    };
  } catch {
    return { valid: false, error: "Failed to verify API key" };
  }
}

// Helper to create error response
export function apiKeyError(message: string, status: number = 401) {
  return Response.json({ error: message }, { status });
}
