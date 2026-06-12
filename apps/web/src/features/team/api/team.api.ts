import { apiClient } from '@/lib/api/api-client';
import type {
  CreateTeamMemberPayload,
  TeamMember,
  UpdateTeamMemberPayload,
} from '../types/team.types';

export const teamApi = {
  list: () => apiClient.get<TeamMember[]>('/team'),
  create: (payload: CreateTeamMemberPayload) => apiClient.post<TeamMember>('/team', payload),
  update: (membershipId: string, payload: UpdateTeamMemberPayload) =>
    apiClient.patch<TeamMember>(`/team/${membershipId}`, payload),
};
