export interface NotificationSendInput {
  to: string;
  message: string;
}

export interface NotificationSendResult {
  success: boolean;
  providerId: string | null;
  error: string | null;
}

export interface NotificationProvider {
  send(input: NotificationSendInput): Promise<NotificationSendResult>;
}
