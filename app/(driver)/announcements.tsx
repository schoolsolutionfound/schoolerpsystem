import React from 'react';
import { DriverShell } from '../../features/driver/components/DriverShell';
import { UserAnnouncementFeedView } from '../../features/announcements';

export default function DriverAnnouncementsScreen() {
  return (
    <DriverShell activeTab="announcements">
      <UserAnnouncementFeedView />
    </DriverShell>
  );
}
