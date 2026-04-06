export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  is_shared: boolean;
  created_by: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  member_count?: number;
}
