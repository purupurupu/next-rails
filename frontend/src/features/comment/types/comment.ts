// Comment type definitions

import type { UserRef } from "@/types/user";

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  editable: boolean;
  user: UserRef;
}

export interface CreateCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}
