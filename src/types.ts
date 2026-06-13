export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  isAiPowered?: boolean;
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  tools: Tool[];
}

export interface FeedbackSubmission {
  id: string;
  toolId: string;
  toolName: string;
  rating: number;
  comments: string;
  email?: string;
  name?: string;
  timestamp: string;
}
