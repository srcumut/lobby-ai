import { apiClient } from "./client";
import { MessageSender } from "./lobbies";

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  position: number;
  vote_count: number;
  percentage: number;
  has_voted: boolean;
}

export interface Poll {
  id: string;
  lobby_id: string;
  creator: MessageSender;
  question: string;
  is_multiple_choice: boolean;
  is_closed: boolean;
  total_votes: number;
  options: PollOption[];
  ends_at: string | null;
  created_at: string;
  user_voted: boolean;
}

export interface CreatePollDto {
  question: string;
  options: string[];
  is_multiple_choice?: boolean;
  duration_minutes?: number | null;
}

export const pollsApi = {
  getPolls: async (lobbyId: string): Promise<Poll[]> => {
    const res = await apiClient.get<Poll[]>(`/lobbies/${lobbyId}/polls`);
    return res.data;
  },

  createPoll: async (lobbyId: string, data: CreatePollDto): Promise<Poll> => {
    const res = await apiClient.post<Poll>(`/lobbies/${lobbyId}/polls`, data);
    return res.data;
  },

  votePoll: async (lobbyId: string, pollId: string, optionId: string): Promise<Poll> => {
    const res = await apiClient.post<Poll>(`/lobbies/${lobbyId}/polls/${pollId}/vote`, {
      option_id: optionId,
    });
    return res.data;
  },

  closePoll: async (lobbyId: string, pollId: string): Promise<Poll> => {
    const res = await apiClient.post<Poll>(`/lobbies/${lobbyId}/polls/${pollId}/close`);
    return res.data;
  },
};
