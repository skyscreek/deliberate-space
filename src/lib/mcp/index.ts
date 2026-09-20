import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDiscussionsTool from "./tools/list-discussions";
import getDiscussionTool from "./tools/get-discussion";
import getDiscussionInsightsTool from "./tools/get-discussion-insights";
import createPostTool from "./tools/create-post";
import createDiscussionTool from "./tools/create-discussion";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "deliberate-space",
  title: "Deliberate Space",
  version: "0.1.0",
  instructions:
    "Tools for Deliberate Space, a deliberation platform with topics, threaded posts and AI deliberation insights. Use `list_discussions` to find topics, `get_discussion` to read a full thread, `get_discussion_insights` for tensions, clusters and open questions, `create_post` to contribute as the signed-in user, and `create_discussion` to open a new topic.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listDiscussionsTool,
    getDiscussionTool,
    getDiscussionInsightsTool,
    createPostTool,
    createDiscussionTool,
  ],
});
