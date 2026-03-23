export interface Meeting {
  id: string;
  short_code: string;
  name: string;
  description: string | null;
  status: 'Active' | 'Closed';
  creator_id: string;
  created_at: number;
  user_role?: string;
  member_count?: number;
  question_count?: number;
}

export interface Question {
  id: number;
  meeting_id: string;
  author_id: string;
  author_email: string;
  content: string;
  created_at: number;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
}

export interface User {
  id: string;
  email: string;
}

export interface Owner {
  id: string;
  email: string;
  isCreator: boolean;
}

export interface ApiError {
  error: string;
}

export const MEETING_ROLES = {
  OWNER: 'Owner',
  MEMBER: 'Member',
} as const;

export type MeetingRole = (typeof MEETING_ROLES)[keyof typeof MEETING_ROLES];

export function getRoleDisplayName(role?: string): string {
  switch (role) {
    case MEETING_ROLES.OWNER:
      return 'Owner';
    case MEETING_ROLES.MEMBER:
      return 'Member';
    default:
      return 'Creator';
  }
}
