export type AnnouncementType = 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'URGENT' | 'NOTICE';
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'CANCELLED';
export type TargetType = 'all' | 'role' | 'class' | 'section';
export type CreateAction = 'draft' | 'publish' | 'schedule';

export interface AnnouncementTarget {
  id?: string;
  announcementId?: string;
  targetType: TargetType;
  targetRole?: string;
  classId?: string;
  sectionId?: string;
  createdAt?: string;
}

export interface Announcement {
  id: string;
  institutionCode: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  createdBy: string;
  publishAt?: string | null;
  expiresAt?: string | null;
  imageUrl?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  targets?: AnnouncementTarget[];
  isRead?: boolean;
  readAt?: string | null;
  readCount?: number;
}

export interface AnnouncementFilterState {
  search?: string;
  type?: AnnouncementType | 'ALL';
  priority?: AnnouncementPriority | 'ALL';
  status?: AnnouncementStatus | 'ALL';
  audience?: string;
}
