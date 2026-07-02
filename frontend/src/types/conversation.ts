export interface Conversation {
  id: string;
  investor_id: string;
  title: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  last_message?: string;
  message_count: number;
  is_escalated: boolean;
  assigned_advisor_id?: string;
}

export type ConversationStatus = 'active' | 'escalated' | 'resolved' | 'closed';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'advisor';

export interface MessageMetadata {
  intent?: string;
  confidence?: number;
  suggested_actions?: SuggestedAction[];
  escalation_reason?: string;
  advisor_name?: string;
}

export interface SuggestedAction {
  label: string;
  action: string;
  payload?: Record<string, string>;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface SendMessageRequest {
  content: string;
  conversation_id?: string;
}

export interface SendMessageResponse {
  user_message: Message;
  assistant_message: Message;
  conversation_id: string;
}

export interface CreateConversationRequest {
  title?: string;
  initial_message?: string;
}
