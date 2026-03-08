export interface Author {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface Reaction {
  type: 'support' | 'nuance' | 'disagree';
  count: number;
  userReacted: boolean;
}

export interface Reply {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  reactions: Reaction[];
}

export interface Post {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  reactions: Reaction[];
  replies: Reply[];
}

export interface Tension {
  id: string;
  label: string;
  sideA: string;
  sideB: string;
  relatedPostIds: string[];
}

export interface ArgumentCluster {
  id: string;
  name: string;
  description: string;
  postCount: number;
  relatedPostIds: string[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  raisedInPostId: string;
  raisedBy?: string;
  relatedPostIds: string[];
}

export interface GuidanceItem {
  id: string;
  type: 'overrepresented' | 'evidence-needed' | 'missing-perspective' | 'gap' | 'missing-counterargument' | 'missing-alternative' | 'unresolved-question';
  label: string;
  description: string;
}

export interface TopicMeta {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'seeking-consensus' | 'resolved';
  author: Author;
  createdAt: string;
  participantCount: number;
  postCount: number;
  proposal: string;
}

export interface EmergingProposal {
  id: string;
  title: string;
  description: string;
  supportedBy: string[];
  relatedPostIds: string[];
}

export interface PositionReference {
  authorName: string;
  position: string;
  postId: string;
}

export interface DiscussionSummaryData {
  text: string;
  positions: PositionReference[];
  tensions: Tension[];
  openQuestions: OpenQuestion[];
  emergingProposals: EmergingProposal[];
}

// Argument map types
export interface ArgumentNode {
  id: string;
  type: 'claim' | 'support' | 'objection' | 'concern' | 'alternative' | 'question' | 'proposal';
  text: string;
  author?: string;
  relatedPostIds: string[];
  children: ArgumentNode[];
}

export interface Topic extends TopicMeta {
  posts: Post[];
  tensions: Tension[];
  clusters: ArgumentCluster[];
  openQuestions: OpenQuestion[];
  guidance: GuidanceItem[];
  summary: DiscussionSummaryData;
  emergingProposals: EmergingProposal[];
  argumentMap: ArgumentNode[];
}

export interface ActiveFilter {
  type: 'tension' | 'cluster' | 'question';
  id: string;
  relatedPostIds: string[];
}
