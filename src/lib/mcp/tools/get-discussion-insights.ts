import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_discussion_insights",
  title: "Get deliberation insights",
  description:
    "Read the cached deliberation analysis for a discussion: summary, tensions, argument clusters, open questions and contribution guidance.",
  inputSchema: {
    topic_id: z.string().uuid().describe("Topic id, as returned by list_discussions or get_discussion."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ topic_id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);

    const { data, error } = await supabase
      .from("ai_analyses")
      .select("content, created_at, analysis_type")
      .eq("topic_id", topic_id)
      .eq("analysis_type", "full")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No deliberation analysis exists yet for this discussion. It can be generated in the app's Insights panel.",
          },
        ],
        structuredContent: { analysis: null },
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data.content) }],
      structuredContent: {
        created_at: data.created_at,
        analysis: data.content as unknown as Record<string, unknown>,
      },
    };
  },
});
