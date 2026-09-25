export type NotificationCategory =
  | "workflow_completed"
  | "employee_completed"
  | "employee_attention"
  | "automation_failed"
  | "account";

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
};
