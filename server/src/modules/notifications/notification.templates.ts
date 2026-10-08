import { NotificationTemplateRecord } from './notification.types.js';

/**
 * Render a template with variable substitution.
 * Template syntax: {{variableName}}
 * Unresolved variables are left as-is for debugging.
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in variables && variables[key] !== undefined && variables[key] !== null) {
      return String(variables[key]);
    }
    return match;
  });
}

export function renderTitle(
  dbTemplate: NotificationTemplateRecord | null,
  fallbackTitle: string,
  variables: Record<string, any>
): string {
  if (dbTemplate?.titleTemplate) {
    return renderTemplate(dbTemplate.titleTemplate, variables);
  }
  return renderTemplate(fallbackTitle, variables);
}

export function renderBody(
  dbTemplate: NotificationTemplateRecord | null,
  fallbackBody: string,
  variables: Record<string, any>
): string {
  if (dbTemplate?.bodyTemplate) {
    return renderTemplate(dbTemplate.bodyTemplate, variables);
  }
  return renderTemplate(fallbackBody, variables);
}

/**
 * Default templates for each notification type.
 * These are used when no institution-specific template exists.
 */
export const DEFAULT_TEMPLATES: Record<string, { title: string; body: string }> = {
  attendance_absent: {
    title: 'Attendance Alert: {{studentName}} was absent',
    body: '{{studentName}} was marked absent for {{subject}} on {{date}}. Class: {{className}}.',
  },
  attendance_late: {
    title: 'Late Arrival: {{studentName}}',
    body: '{{studentName}} arrived late for {{subject}} on {{date}}. Class: {{className}}.',
  },
  fee_due: {
    title: 'Fee Due: {{amount}} for {{studentName}}',
    body: 'Dear {{parentName}}, a fee of ₹{{amount}} for {{studentName}} ({{className}}) is due on {{dueDate}}.',
  },
  fee_paid: {
    title: 'Payment Received: ₹{{amount}}',
    body: 'Payment of ₹{{amount}} received for {{studentName}}. Receipt: {{receiptNo}}.',
  },
  fee_overdue: {
    title: 'OVERDUE: ₹{{amount}} fee for {{studentName}}',
    body: 'The fee of ₹{{amount}} for {{studentName}} ({{className}}) is overdue. Due date was {{dueDate}}.',
  },
  exam_published: {
    title: 'Results Published: {{examName}}',
    body: 'The results for {{examName}} have been published. Check your marks now.',
  },
  exam_scheduled: {
    title: 'Exam Scheduled: {{examName}}',
    body: '{{examName}} is scheduled from {{startDate}} to {{endDate}}. Best of luck!',
  },
  homework_assigned: {
    title: 'New Homework: {{subject}}',
    body: '{{teacherName}} assigned homework in {{subject}} for {{className}}. Due: {{dueDate}}. {{title}}',
  },
  homework_due_tomorrow: {
    title: 'Homework Due Tomorrow: {{subject}}',
    body: 'Your homework in {{subject}} is due tomorrow. {{title}}',
  },
  timetable_changed: {
    title: 'Timetable Updated',
    body: 'The timetable for {{className}} has been updated effective {{date}}.',
  },
  announcement: {
    title: '{{title}}',
    body: '{{body}}',
  },
  bus_arriving: {
    title: 'Bus Arriving Soon',
    body: 'Your bus {{busNumber}} is approaching {{stopName}}. ETA: {{eta}} minutes.',
  },
  library_due: {
    title: 'Library Book Due: {{bookTitle}}',
    body: 'Your borrowed book "{{bookTitle}}" is due on {{dueDate}}. Please return it on time.',
  },
  library_overdue: {
    title: 'OVERDUE: {{bookTitle}}',
    body: 'Your borrowed book "{{bookTitle}}" is overdue by {{days}} days. Fine: ₹{{fine}}.',
  },
  admission_update: {
    title: 'Application {{status}}: {{childName}}',
    body: 'The admission application for {{childName}} has been {{status}}.',
  },
  system: {
    title: '{{title}}',
    body: '{{body}}',
  },
  reminder: {
    title: 'Reminder: {{title}}',
    body: '{{body}}',
  },
  chat_message: {
    title: 'New message from {{senderName}}',
    body: '{{messagePreview}}',
  },
};

/**
 * Maps a general notification type (as stored in notifications.type) to the
 * specific default template key to use when no institution template exists.
 */
const TYPE_TEMPLATE_KEY: Record<string, string> = {
  attendance: 'attendance_absent',
  fee: 'fee_paid',
  exam: 'exam_published',
  homework: 'homework_assigned',
  timetable: 'timetable_changed',
  bus: 'bus_arriving',
  library: 'library_due',
  admission: 'admission_update',
  chat: 'chat_message',
  announcement: 'announcement',
  reminder: 'reminder',
  system: 'system',
  general: 'system',
};

export function getDefaultTemplate(type: string): { title: string; body: string } | null {
  if (DEFAULT_TEMPLATES[type]) return DEFAULT_TEMPLATES[type];
  const key = TYPE_TEMPLATE_KEY[type];
  return key ? DEFAULT_TEMPLATES[key] || null : null;
}
