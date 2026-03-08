import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic_id } = await req.json();
    if (!topic_id) throw new Error("topic_id required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch topic
    const { data: topic, error: topicErr } = await supabase
      .from("topics")
      .select("id, title, description, proposal, category, status")
      .eq("id", topic_id)
      .single();
    if (topicErr) throw topicErr;

    // Fetch all posts with profiles
    const { data: posts, error: postsErr } = await supabase
      .from("posts")
      .select("id, content, author_id, argdown_type, score, depth, parent_post_id, created_at")
      .eq("topic_id", topic_id)
      .order("created_at", { ascending: true });
    if (postsErr) throw postsErr;

    if (!posts || posts.length === 0) {
      // No posts, return empty analysis
      const emptyResult = {
        summary: "This discussion has no contributions yet.",
        tensions: [],
        clusters: [],
        open_questions: [],
        guidance: [],
        classifications: [],
      };
      // Store it
      await supabase.from("ai_analyses").upsert(
        {
          topic_id,
          analysis_type: "full",
          content: emptyResult,
          model: "google/gemini-3-flash-preview",
        },
        { onConflict: "topic_id,analysis_type" }
      );
      return new Response(JSON.stringify(emptyResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch author names
    const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", authorIds);
    const nameMap = new Map<string, string>();
    for (const p of profiles || []) nameMap.set(p.user_id, p.display_name);

    // Build discussion text for LLM
    const postTexts = posts.map((p: any) => {
      const author = nameMap.get(p.author_id) || "Unknown";
      const type = p.argdown_type ? ` [${p.argdown_type}]` : "";
      const indent = "  ".repeat(p.depth);
      return `${indent}[${p.id}] ${author}${type} (score: ${p.score}): ${p.content}`;
    }).join("\n");

    const prompt = `You are a deliberation analyst for a discussion platform. Analyze this discussion and return structured JSON.

TOPIC: ${topic.title}
CATEGORY: ${topic.category}
STATUS: ${topic.status}
DESCRIPTION: ${topic.description || ""}
PROPOSAL: ${topic.proposal || ""}

POSTS (format: [post_id] Author [type] (score): content):
${postTexts}

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "summary": "2-4 sentence summary of the discussion state, key positions, and progress toward resolution",
  "tensions": [
    {
      "id": "tension-1",
      "label": "Short tension name",
      "sideA": "Position A summary",
      "sideB": "Position B summary",
      "relatedPostIds": ["post-id-1", "post-id-2"]
    }
  ],
  "clusters": [
    {
      "id": "cluster-1",
      "name": "Cluster name",
      "description": "What this cluster of arguments is about",
      "postCount": 3,
      "relatedPostIds": ["post-id-1", "post-id-2"]
    }
  ],
  "open_questions": [
    {
      "id": "q-1",
      "question": "The open question text",
      "raisedInPostId": "post-id",
      "raisedBy": "Author Name",
      "relatedPostIds": ["post-id-1"]
    }
  ],
  "guidance": [
    {
      "id": "g-1",
      "type": "evidence-needed|missing-perspective|missing-counterargument|missing-alternative|unresolved-question|gap|overrepresented",
      "label": "Short actionable label",
      "description": "What kind of contribution would help",
      "targetPostId": "post-id or null",
      "suggestedArgdownType": "evidence|support|objection|concern|alternative|question|proposal|rebuttal|claim"
    }
  ],
  "classifications": [
    {
      "postId": "post-id",
      "suggestedType": "claim|support|objection|concern|alternative|question|proposal|evidence|rebuttal",
      "confidence": 0.85
    }
  ]
}

Rules:
- Use ONLY post IDs that exist in the discussion above
- Return 2-5 tensions, 2-5 clusters, 2-5 open questions, 3-6 guidance items
- Classifications: suggest types for posts that don't have one yet, or correct obviously wrong ones
- Be specific and grounded in the actual content — don't invent positions not present
- Guidance should be actionable and help diversify the discussion`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a structured data extraction assistant. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown fences if present
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON");
    }

    // Store in ai_analyses — upsert by topic_id + analysis_type
    // First check if exists
    const { data: existing } = await supabase
      .from("ai_analyses")
      .select("id")
      .eq("topic_id", topic_id)
      .eq("analysis_type", "full")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("ai_analyses")
        .update({ content: analysis, model: "google/gemini-3-flash-preview", created_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("ai_analyses").insert({
        topic_id,
        analysis_type: "full",
        content: analysis,
        model: "google/gemini-3-flash-preview",
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-discussion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
