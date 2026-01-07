import { Client } from "@notionhq/client";
import type { Highlight, Book } from "@/types/database";

// Notion 클라이언트 생성
export function createNotionClient(accessToken: string): Client {
  return new Client({
    auth: accessToken,
  });
}

// 토큰 유효성 검증
export async function validateNotionToken(accessToken: string): Promise<{
  valid: boolean;
  user?: { name: string; email?: string };
  error?: string;
}> {
  try {
    const notion = createNotionClient(accessToken);
    const response = await notion.users.me({});

    return {
      valid: true,
      user: {
        name: response.name || "Unknown",
        email: response.type === "person" ? response.person?.email : undefined,
      },
    };
  } catch (error) {
    console.error("Notion token validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}

// 사용자가 접근 가능한 데이터베이스 목록 가져오기
export async function listNotionDatabases(accessToken: string): Promise<
  Array<{
    id: string;
    title: string;
    url: string;
  }>
> {
  const notion = createNotionClient(accessToken);

  // Use search API
  const response = await notion.search({
    page_size: 100,
  });

  const databases: Array<{ id: string; title: string; url: string }> = [];

  for (const result of response.results) {
    // Type-safe check for database objects
    const obj = result as Record<string, unknown>;
    if (obj.object === "database" && "title" in obj && "url" in obj) {
      const titleArr = obj.title as Array<{ plain_text?: string }> | undefined;
      databases.push({
        id: obj.id as string,
        title: titleArr?.[0]?.plain_text || "Untitled",
        url: obj.url as string,
      });
    }
  }

  return databases;
}

// VIVE 전용 데이터베이스 생성
export async function createViveDatabase(
  accessToken: string,
  parentPageId: string
): Promise<{
  id: string;
  title: string;
  url: string;
}> {
  const notion = createNotionClient(accessToken);

  // Use raw request to avoid TypeScript issues with SDK types
  const response = await notion.request({
    path: "databases",
    method: "post",
    body: {
      parent: {
        type: "page_id",
        page_id: parentPageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: "VIVE 독서 하이라이트",
          },
        },
      ],
      properties: {
        Title: { title: {} },
        Book: { rich_text: {} },
        Author: { rich_text: {} },
        Location: { rich_text: {} },
        Chapter: { rich_text: {} },
        Note: { rich_text: {} },
        Summary: { rich_text: {} },
        CreatedAt: { date: {} },
        Source: {
          select: {
            options: [
              { name: "MANUAL", color: "gray" },
              { name: "KINDLE", color: "orange" },
              { name: "MILLIE", color: "blue" },
              { name: "RIDI", color: "purple" },
              { name: "OTHER", color: "default" },
            ],
          },
        },
        ViveId: { rich_text: {} },
      },
    },
  });

  const res = response as { id: string; title?: Array<{ plain_text?: string }>; url?: string };

  return {
    id: res.id,
    title: res.title?.[0]?.plain_text || "VIVE 독서 하이라이트",
    url: res.url || "",
  };
}

// 하이라이트를 Notion 페이지로 생성
export async function createHighlightPage(
  accessToken: string,
  databaseId: string,
  highlight: Highlight,
  book: Pick<Book, "title" | "author" | "source">
): Promise<{
  pageId: string;
  url: string;
}> {
  const notion = createNotionClient(accessToken);

  // 제목: 하이라이트 내용 앞 50자
  const title = highlight.content.slice(0, 50) + (highlight.content.length > 50 ? "..." : "");

  const children: Array<Record<string, unknown>> = [
    {
      object: "block",
      type: "quote",
      quote: {
        rich_text: [
          {
            type: "text",
            text: { content: highlight.content },
          },
        ],
      },
    },
  ];

  if (highlight.note) {
    children.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "내 메모" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: highlight.note } }],
        },
      }
    );
  }

  if (highlight.summary) {
    children.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "AI 요약" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: highlight.summary } }],
        },
      }
    );
  }

  const response = await notion.request({
    path: "pages",
    method: "post",
    body: {
      parent: {
        type: "database_id",
        database_id: databaseId,
      },
      properties: {
        Title: {
          title: [{ type: "text", text: { content: title } }],
        },
        Book: {
          rich_text: [{ type: "text", text: { content: book.title } }],
        },
        Author: {
          rich_text: book.author ? [{ type: "text", text: { content: book.author } }] : [],
        },
        Location: {
          rich_text: highlight.page_number
            ? [{ type: "text", text: { content: `p.${highlight.page_number}` } }]
            : [],
        },
        Chapter: {
          rich_text: highlight.chapter
            ? [{ type: "text", text: { content: highlight.chapter } }]
            : [],
        },
        Note: {
          rich_text: highlight.note
            ? [{ type: "text", text: { content: highlight.note } }]
            : [],
        },
        Summary: {
          rich_text: highlight.summary
            ? [{ type: "text", text: { content: highlight.summary } }]
            : [],
        },
        CreatedAt: {
          date: { start: highlight.created_at },
        },
        Source: {
          select: { name: book.source },
        },
        ViveId: {
          rich_text: [{ type: "text", text: { content: highlight.id } }],
        },
      },
      children,
    },
  });

  const res = response as { id: string; url?: string };

  return {
    pageId: res.id,
    url: res.url || "",
  };
}

// 기존 Notion 페이지 업데이트
export async function updateHighlightPage(
  accessToken: string,
  pageId: string,
  highlight: Highlight,
  book: Pick<Book, "title" | "author" | "source">
): Promise<void> {
  const notion = createNotionClient(accessToken);

  const title = highlight.content.slice(0, 50) + (highlight.content.length > 50 ? "..." : "");

  await notion.request({
    path: `pages/${pageId}`,
    method: "patch",
    body: {
      properties: {
        Title: {
          title: [{ type: "text", text: { content: title } }],
        },
        Book: {
          rich_text: [{ type: "text", text: { content: book.title } }],
        },
        Author: {
          rich_text: book.author ? [{ type: "text", text: { content: book.author } }] : [],
        },
        Note: {
          rich_text: highlight.note
            ? [{ type: "text", text: { content: highlight.note } }]
            : [],
        },
        Summary: {
          rich_text: highlight.summary
            ? [{ type: "text", text: { content: highlight.summary } }]
            : [],
        },
      },
    },
  });
}

// Notion 페이지 삭제 (아카이브)
export async function archiveHighlightPage(
  accessToken: string,
  pageId: string
): Promise<void> {
  const notion = createNotionClient(accessToken);

  await notion.request({
    path: `pages/${pageId}`,
    method: "patch",
    body: {
      archived: true,
    },
  });
}

// 데이터베이스에서 VIVE ID로 기존 페이지 찾기
export async function findPageByViveId(
  accessToken: string,
  databaseId: string,
  highlightId: string
): Promise<string | null> {
  const notion = createNotionClient(accessToken);

  try {
    const response = await notion.request({
      path: `databases/${databaseId}/query`,
      method: "post",
      body: {
        filter: {
          property: "ViveId",
          rich_text: {
            equals: highlightId,
          },
        },
        page_size: 1,
      },
    });

    const res = response as { results?: Array<{ id: string }> };
    return res.results && res.results.length > 0 ? res.results[0].id : null;
  } catch (error) {
    console.error(`findPageByViveId error (DB: ${databaseId}, Highlight: ${highlightId}):`, error);
    return null; // 에러 시 null 반환하여 새 페이지 생성 시도 (또는 에러 전파)
  }
}

// 사용자가 접근 가능한 페이지 목록 (데이터베이스 생성용 부모 페이지 선택)
export async function listNotionPages(accessToken: string): Promise<
  Array<{
    id: string;
    title: string;
    url: string;
  }>
> {
  const notion = createNotionClient(accessToken);

  const response = await notion.search({
    page_size: 50,
  });

  const pages: Array<{ id: string; title: string; url: string }> = [];

  for (const result of response.results) {
    const obj = result as Record<string, unknown>;

    if (obj.object === "page" && "url" in obj && "parent" in obj) {
      const parent = obj.parent as { type?: string };

      // 데이터베이스 내 페이지는 제외
      if (parent.type === "database_id") {
        continue;
      }

      // 페이지 제목 추출
      let title = "Untitled";
      if ("properties" in obj && obj.properties) {
        const props = obj.properties as Record<string, { type?: string; title?: Array<{ plain_text?: string }> }>;
        for (const prop of Object.values(props)) {
          if (prop.type === "title" && prop.title?.[0]?.plain_text) {
            title = prop.title[0].plain_text;
            break;
          }
        }
      }

      pages.push({
        id: obj.id as string,
        title,
        url: obj.url as string,
      });
    }
  }

  return pages;
}

// 데이터베이스 스키마(속성) 업데이트
export async function ensureDatabaseSchema(
  accessToken: string,
  databaseId: string
): Promise<void> {
  const notion = createNotionClient(accessToken);
  
  try {
    // 현재 스키마 조회
    const response = await notion.request({
      path: `databases/${databaseId}`,
      method: "get",
    });
    
    const db = response as { properties: Record<string, unknown> };
    const properties = db.properties;
    
    const propertiesToUpdate: Record<string, unknown> = {};
    
    // 필요한 속성이 없으면 추가
    if (!("ViveId" in properties)) propertiesToUpdate["ViveId"] = { rich_text: {} };
    if (!("Book" in properties)) propertiesToUpdate["Book"] = { rich_text: {} };
    if (!("Author" in properties)) propertiesToUpdate["Author"] = { rich_text: {} };
    if (!("Location" in properties)) propertiesToUpdate["Location"] = { rich_text: {} };
    if (!("Chapter" in properties)) propertiesToUpdate["Chapter"] = { rich_text: {} };
    if (!("Note" in properties)) propertiesToUpdate["Note"] = { rich_text: {} };
    if (!("Summary" in properties)) propertiesToUpdate["Summary"] = { rich_text: {} };
    if (!("CreatedAt" in properties)) propertiesToUpdate["CreatedAt"] = { date: {} };
    if (!("Source" in properties)) {
      propertiesToUpdate["Source"] = {
        select: {
          options: [
            { name: "MANUAL", color: "gray" },
            { name: "KINDLE", color: "orange" },
            { name: "MILLIE", color: "blue" },
            { name: "RIDI", color: "purple" },
            { name: "OTHER", color: "default" },
          ],
        },
      };
    }

    // 업데이트할 속성이 있으면 API 호출
    if (Object.keys(propertiesToUpdate).length > 0) {
      console.log(`Updating database schema for DB ${databaseId}:`, Object.keys(propertiesToUpdate));
      await notion.request({
        path: `databases/${databaseId}`,
        method: "patch",
        body: {
          properties: propertiesToUpdate,
        },
      });
    }
  } catch (error) {
    console.error("Failed to ensure database schema:", error);
  }
}
