export interface ServiceRequest {
  id: string;
  investor_id: string;
  investor_name: string;
  conversation_id?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_advisor_id?: string;
  assigned_advisor_name?: string;
  ai_summary?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export type TicketCategory =
  | 'sip_failure'
  | 'redemption'
  | 'kyc'
  | 'nominee_update'
  | 'statement_request'
  | 'complaint'
  | 'general_inquiry'
  | 'technical_issue'
  | 'other';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TicketNote {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  author_role: 'advisor' | 'system' | 'admin';
  content: string;
  created_at: string;
}

export interface TicketDetail extends ServiceRequest {
  notes: TicketNote[];
  conversation_history?: {
    id: string;
    messages: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
  };
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_advisor_id?: string;
  resolution_notes?: string;
}

export interface AddNoteRequest {
  content: string;
}

export interface TicketStats {
  total_open: number;
  total_in_progress: number;
  total_resolved_today: number;
  avg_resolution_time_hours: number;
  escalations_today: number;
}
