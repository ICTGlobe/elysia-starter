export interface TeamMemberResponse {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
