import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "discussion"}-${suffix}`;
}

export default defineTool({
  name: "create_discussion",
  title: "Create a discussion",
  description:
    "Create a new discussion topic as the signed-in user, with a title, description, category and optional concrete proposal.",
  inputSchema: {
    title: z.string().trim().min(3).describe("Discussion title."),
    description: z.string().trim().describe("What the discussion is about. Pass an empty string if unknown."),
    category: z.string().trim().describe("Category label, e.g. 'Urban Planning'."),
    proposal: z.string().trim().nullable().describe("A concrete proposal under debate, or null."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, category, proposal }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Authenticated user required");
    const supabase = supabaseForUser(ctx);

    const { data, error } = await supabase
      .from("topics")
      .insert({
        title,
        description,
        category,
        proposal: proposal ?? null,
        slug: slugify(title),
        author_id: userId,
      })
      .select("id, title, slug, category, status, description, proposal, created_at")
      .single();
    if (error) throw new ToolError(error.message);

    return {
      content: [{ type: "text" as const, text: `Created discussion "${data.title}" (slug: ${data.slug}).` }],
      structuredContent: {
        topic: {
          id: data.id,
          title: data.title,
          slug: data.slug,
          category: data.category,
          status: data.status,
          description: data.description,
          proposal: data.proposal ?? null,
          created_at: data.created_at,
        },
      },
    };
  },
});
