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
  relatedPostIds: string[];
}

export interface GuidanceItem {
  id: string;
  type: 'overrepresented' | 'evidence-needed' | 'missing-perspective' | 'gap';
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

export interface Topic extends TopicMeta {
  posts: Post[];
  tensions: Tension[];
  clusters: ArgumentCluster[];
  openQuestions: OpenQuestion[];
  guidance: GuidanceItem[];
  summary: string;
}

export interface ActiveFilter {
  type: 'tension' | 'cluster' | 'question';
  id: string;
  relatedPostIds: string[];
}
