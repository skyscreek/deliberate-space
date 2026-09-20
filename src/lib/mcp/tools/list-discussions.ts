import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_discussions",
  title: "List discussions",
  description:
    "List discussion topics on the platform, newest first. Optionally filter by category or free-text search in title and description.",
  inputSchema: {
    search: z.string().trim().nullable().describe("Free-text search over title and description. Pass null for no search."),
    category: z.string().trim().nullable().describe("Exact category filter, e.g. 'Urban Planning'. Pass null for all categories."),
    limit: z.number().int().min(1).max(50).describe("Maximum number of topics to return (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("topics")
      .select("id, title, slug, category, status, description, proposal, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new ToolError(error.message);

    const topics = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      category: t.category,
      status: t.status,
      description: t.description,
      proposal: t.proposal ?? null,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: topics.length
            ? topics.map((t) => `- ${t.title} [${t.category}, ${t.status}] (slug: ${t.slug})`).join("\n")
            : "No discussions matched.",
        },
      ],
      structuredContent: { topics },
    };
  },
});
