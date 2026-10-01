export type NotificationKind =
  | 'bidAccepted'
  | 'poUpdated'
  | 'invoiceReminder'
  | 'documentExpiring'
  | 'paymentReceived'
  | 'projectAssigned'
  | 'bidDueSoon'
  | 'contactAdded';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  /** Display text such as "2h ago" or "Yesterday". */
  timeAgo: string;
  isRead: boolean;
}
