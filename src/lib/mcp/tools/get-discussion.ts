import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_discussion",
  title: "Get discussion with posts",
  description:
    "Read one discussion by slug or id, including its threaded posts with author names, argument types and scores.",
  inputSchema: {
    slug: z.string().trim().nullable().describe("Topic slug, e.g. 'car-free-friedrichstrasse'. Pass null if using id."),
    id: z.string().uuid().nullable().describe("Topic id. Pass null if using slug."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    if (!slug && !id) throw new ToolError("Provide either slug or id");
    const supabase = supabaseForUser(ctx);

    const topicQuery = supabase
      .from("topics")
      .select("id, title, slug, category, status, description, proposal, created_at, updated_at");
    const { data: topic, error: topicError } = id
      ? await topicQuery.eq("id", id).maybeSingle()
      : await topicQuery.eq("slug", slug!).maybeSingle();
    if (topicError) throw new ToolError(topicError.message);
    if (!topic) throw new ToolError("Discussion not found");

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, content, author_id, argdown_type, score, depth, parent_post_id, created_at")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });
    if (postsError) throw new ToolError(postsError.message);

    const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
    const names = new Map<string, string>();
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", authorIds);
      for (const p of profiles ?? []) names.set(p.user_id, p.display_name);
    }

    const postList = (posts ?? []).map((p) => ({
      id: p.id,
      content: p.content,
      author: names.get(p.author_id) ?? "Unknown",
      argdown_type: p.argdown_type ?? null,
      score: p.score,
      depth: p.depth,
      parent_post_id: p.parent_post_id ?? null,
      created_at: p.created_at,
    }));

    const topicJson = {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      category: topic.category,
      status: topic.status,
      description: topic.description,
      proposal: topic.proposal ?? null,
      created_at: topic.created_at,
      updated_at: topic.updated_at,
    };

    const text = [
      `# ${topicJson.title} [${topicJson.category}, ${topicJson.status}]`,
      topicJson.description,
      topicJson.proposal ? `Proposal: ${topicJson.proposal}` : "",
      "",
      ...postList.map(
        (p) =>
          `${"  ".repeat(p.depth)}[${p.id}] ${p.author}${p.argdown_type ? ` (${p.argdown_type})` : ""} score ${p.score}: ${p.content}`,
      ),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: { topic: topicJson, posts: postList },
    };
  },
});
