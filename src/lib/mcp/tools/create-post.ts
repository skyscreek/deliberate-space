import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const argdownTypes = [
  "claim",
  "support",
  "objection",
  "concern",
  "alternative",
  "question",
  "proposal",
  "evidence",
  "rebuttal",
] as const;

export default defineTool({
  name: "create_post",
  title: "Post a contribution",
  description:
    "Post a contribution as the signed-in user: a top-level post in a discussion, or a reply to an existing post.",
  inputSchema: {
    topic_id: z.string().uuid().describe("Topic id the contribution belongs to."),
    content: z.string().trim().min(2).describe("The contribution text."),
    parent_post_id: z.string().uuid().nullable().describe("Post id to reply to, or null for a top-level post."),
    argdown_type: z.enum(argdownTypes).nullable().describe("Argument type of the contribution, or null."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ topic_id, content, parent_post_id, argdown_type }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Authenticated user required");
    const supabase = supabaseForUser(ctx);

    let depth = 0;
    if (parent_post_id) {
      const { data: parent, error: parentError } = await supabase
        .from("posts")
        .select("depth, topic_id")
        .eq("id", parent_post_id)
        .maybeSingle();
      if (parentError) throw new ToolError(parentError.message);
      if (!parent) throw new ToolError("Parent post not found");
      if (parent.topic_id !== topic_id) throw new ToolError("Parent post belongs to a different discussion");
      depth = parent.depth + 1;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        topic_id,
        author_id: userId,
        content,
        parent_post_id: parent_post_id ?? null,
        argdown_type: argdown_type ?? null,
        depth,
      })
      .select("id, content, depth, argdown_type, created_at")
      .single();
    if (error) throw new ToolError(error.message);

    return {
      content: [{ type: "text" as const, text: `Posted contribution ${data.id}.` }],
      structuredContent: {
        post: {
          id: data.id,
          content: data.content,
          depth: data.depth,
          argdown_type: data.argdown_type ?? null,
          created_at: data.created_at,
        },
      },
    };
  },
});
