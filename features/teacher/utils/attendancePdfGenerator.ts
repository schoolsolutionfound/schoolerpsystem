import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface ClassAttendancePdfInput {
  classSection?: string | { id?: string; name?: string };
  range?: string | { fromDate?: string; toDate?: string };
  summary?: {
    totalStudents?: number;
    studentsCount?: number;
    averageAttendance?: number;
    averagePercentage?: number;
    presentToday?: number;
    absentToday?: number;
    lowAttendanceCount?: number;
  };
  topPerformers?: { name: string; percentage: number }[];
  lowAttendance?: { name: string; percentage: number }[];
  dailyTrend?: { date: string; percentage: number }[];
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function generateClassAttendancePdfReport(data: ClassAttendancePdfInput): Promise<void> {
  const classSection =
    typeof data.classSection === 'object'
      ? data.classSection?.name || 'Class Section'
      : data.classSection || 'Class Section';

  const range =
    typeof data.range === 'object'
      ? `${data.range?.fromDate || ''} to ${data.range?.toDate || ''}`.trim() || 'Current Term'
      : data.range || 'Current Term';

  const summary = data.summary || {};
  const generatedDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const totalStudents = summary.studentsCount ?? summary.totalStudents ?? 0;
  const rawAvg = summary.averagePercentage ?? summary.averageAttendance ?? 0;
  const avgPct = Math.round(rawAvg);
  const presentCount = summary.presentToday ?? 0;
  const absentCount = summary.absentToday ?? 0;
  const lowCount = summary.lowAttendanceCount ?? (data.lowAttendance ? data.lowAttendance.length : 0);

  const topList = data.topPerformers || [];
  const lowList = data.lowAttendance || [];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Class Attendance Report - ${escapeHtml(classSection)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 3px solid #10B981;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-size: 18px; font-weight: 800; color: #111827; }
    .title { font-size: 14px; font-weight: 700; color: #059669; margin-top: 4px; }
    .meta { text-align: right; font-size: 10px; color: #4B5563; }
    .kpi-grid {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      flex: 1;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    .kpi-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #4B5563; }
    .kpi-val { font-size: 15px; font-weight: 800; margin-top: 4px; }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 4px solid #10B981;
      padding-left: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
    th { background: #F3F4F6; color: #374151; font-weight: 700; text-align: left; padding: 6px 8px; border: 1px solid #E5E7EB; text-transform: uppercase; font-size: 8px; }
    td { padding: 6px 8px; border: 1px solid #E5E7EB; color: #1F2937; word-break: break-word; }
    tr:nth-child(even) { background: #FAFAFA; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    .badge-green { background: #D1FAE5; color: #065F46; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; }
    .badge-red { background: #FEE2E2; color: #991B1B; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #E5E7EB;
      padding-top: 10px;
      font-size: 9px;
      color: #9CA3AF;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">School ERP — Teacher Module</div>
      <div class="title">Class Attendance Report • ${escapeHtml(classSection)}</div>
    </div>
    <div class="meta">
      <div>Reporting Period: <strong>${escapeHtml(range)}</strong></div>
      <div>Generated Date: <strong>${escapeHtml(generatedDate)}</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card" style="background: #EFF6FF; border-color: #BFDBFE;">
      <div class="kpi-label" style="color: #1E40AF;">Class Roster</div>
      <div class="kpi-val" style="color: #1E3A8A;">${totalStudents} Students</div>
    </div>
    <div class="kpi-card" style="background: #F0FDF4; border-color: #BBF7D0;">
      <div class="kpi-label" style="color: #166534;">Average Attendance</div>
      <div class="kpi-val" style="color: #14532D;">${avgPct}%</div>
    </div>
    <div class="kpi-card" style="background: #FEF3C7; border-color: #FDE68A;">
      <div class="kpi-label" style="color: #B45309;">Present vs Absent Today</div>
      <div class="kpi-val" style="color: #78350F;">${presentCount} P / ${absentCount} A</div>
    </div>
    <div class="kpi-card" style="background: #FEF2F2; border-color: #FECACA;">
      <div class="kpi-label" style="color: #991B1B;">Low Attendance (&lt;75%)</div>
      <div class="kpi-val" style="color: #7F1D1D;">${lowCount} Students</div>
    </div>
  </div>

  <div class="section-title">Top Attendance Performers (&ge;90%)</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Student Name</th>
        <th>Attendance Percentage</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        topList.length === 0
          ? `<tr><td colspan="4" style="text-align: center; color: #6B7280; padding: 12px;">No top performer records listed.</td></tr>`
          : topList
              .map(
                (st, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(st.name)}</strong></td>
            <td style="font-weight: 700; color: #059669;">${Math.round(st.percentage)}%</td>
            <td><span class="badge-green">EXCELLENT</span></td>
          </tr>
        `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 20px;">Low Attendance Warnings (&lt;75%)</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Student Name</th>
        <th>Attendance Percentage</th>
        <th>Status Notice</th>
      </tr>
    </thead>
    <tbody>
      ${
        lowList.length === 0
          ? `<tr><td colspan="4" style="text-align: center; color: #6B7280; padding: 12px;">No students below 75% threshold.</td></tr>`
          : lowList
              .map(
                (st, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(st.name)}</strong></td>
            <td style="font-weight: 700; color: #DC2626;">${Math.round(st.percentage)}%</td>
            <td><span class="badge-red">CRITICAL WARNING</span></td>
          </tr>
        `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="footer">
    <div>School ERP System • Teacher Class Attendance Module</div>
    <div>Confidential — Official Academic Record</div>
  </div>
</body>
</html>
  `;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Download Attendance Report - ${classSection}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

