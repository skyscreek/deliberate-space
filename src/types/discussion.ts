export interface ArgumentNode {
  id: string;
  type: 'claim' | 'support' | 'objection' | 'concern' | 'alternative' | 'question' | 'proposal';
  text: string;
  author?: string;
  relatedPostIds: string[];
  children: ArgumentNode[];
  status?: 'resolved' | 'contested' | 'unresolved' | 'emerging';
  strength?: number; // 0-1 representing how well-supported this node is
}
