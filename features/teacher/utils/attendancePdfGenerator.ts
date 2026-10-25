import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { useUserStore } from '../../../store/useUserStore';

export interface ClassAttendanceStudentInput {
  name?: string;
  fullName?: string;
  rollNoOrUSN?: string;
  percentage: number;
  present?: number;
  total?: number;
}

export interface ClassAttendancePdfInput {
  classSection?: string | { id?: string; name?: string };
  range?: string | { fromDate?: string; toDate?: string };
  summary?: {
    totalStudents?: number;
    studentsCount?: number;
    averageAttendance?: number;
    averagePercentage?: number;
    present?: number;
    absent?: number;
    presentToday?: number;
    absentToday?: number;
    lowAttendanceCount?: number;
  };
  topPerformers?: ClassAttendanceStudentInput[];
  lowAttendance?: ClassAttendanceStudentInput[];
  students?: ClassAttendanceStudentInput[];
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
  const userStore = useUserStore.getState();
  const institutionName = userStore.institutionName || userStore.schoolName || '—';

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

  const rawPresent = summary.present ?? summary.presentToday;
  const rawAbsent = summary.absent ?? summary.absentToday;
  const hasPresentAbsentData = rawPresent !== undefined && rawAbsent !== undefined;
  const presentCount = rawPresent ?? 0;
  const absentCount = rawAbsent ?? 0;

  const lowCount = summary.lowAttendanceCount ?? (data.lowAttendance ? data.lowAttendance.length : 0);

  // B7: Enforce >= 90% filter for top performers section
  const topList = (data.topPerformers || []).filter((st) => st.percentage >= 90);
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
      border-bottom: 3px solid #000000;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-size: 18px; font-weight: 800; color: #000000; letter-spacing: 0.5px; text-transform: uppercase; }
    .title { font-size: 14px; font-weight: 700; color: #000000; margin-top: 4px; }
    .meta { text-align: right; font-size: 10px; color: #000000; }
    .kpi-grid {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      flex: 1;
      background: #FFFFFF;
      border: 1.5px solid #000000;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
    }
    .kpi-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #000000; }
    .kpi-val { font-size: 15px; font-weight: 800; color: #000000; margin-top: 4px; }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #000000;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 4px solid #000000;
      padding-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10px;
      border: 1.5px solid #000000;
    }
    th {
      background: #000000;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 7px 8px;
      border: 1px solid #000000;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #000000;
      color: #000000;
      word-break: break-word;
    }
    tr:nth-child(even) { background: #F9FAFB; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    .badge-status { background: #FFFFFF; color: #000000; border: 1px solid #000000; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 8.5px; text-transform: uppercase; }
    .badge-alert { background: #000000; color: #FFFFFF; border: 1px solid #000000; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 8.5px; text-transform: uppercase; }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #000000;
      padding-top: 10px;
      font-size: 9px;
      color: #000000;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${escapeHtml(institutionName)}</div>
      <div class="title">Class Attendance Report • ${escapeHtml(classSection)}</div>
    </div>
    <div class="meta">
      <div>Reporting Period: <strong>${escapeHtml(range)}</strong></div>
      <div>Generated Date: <strong>${escapeHtml(generatedDate)}</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Class Roster</div>
      <div class="kpi-val">${totalStudents} Students</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Average Attendance</div>
      <div class="kpi-val">${avgPct}%</div>
    </div>
    ${
      hasPresentAbsentData
        ? `
    <div class="kpi-card">
      <div class="kpi-label">Present vs Absent</div>
      <div class="kpi-val">${presentCount} P / ${absentCount} A</div>
    </div>`
        : ''
    }
    <div class="kpi-card">
      <div class="kpi-label">Low Attendance (&lt;75%)</div>
      <div class="kpi-val">${lowCount} Students</div>
    </div>
  </div>

  <div class="section-title">Top Attendance Performers (&ge;90%)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Student Name</th>
        <th style="text-align: center;">Attendance Percentage</th>
        <th style="text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        topList.length === 0
          ? `<tr><td colspan="4" style="text-align: center; color: #6B7280; padding: 12px;">No top performer records (&ge;90%) found.</td></tr>`
          : topList
              .map(
                (st, idx) => {
                  const studentName = st.fullName || st.name || '—';
                  return `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(studentName)}</strong></td>
            <td style="font-weight: 700; text-align: center; color: #000000;">${Math.round(st.percentage)}%</td>
            <td style="text-align: center;"><span class="badge-status">EXCELLENT</span></td>
          </tr>
        `;
                }
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 20px;">Low Attendance Warnings (&lt;75%)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Student Name</th>
        <th style="text-align: center;">Attendance Percentage</th>
        <th style="text-align: center;">Status Notice</th>
      </tr>
    </thead>
    <tbody>
      ${
        lowList.length === 0
          ? `<tr><td colspan="4" style="text-align: center; color: #6B7280; padding: 12px;">No students below 75% threshold.</td></tr>`
          : lowList
              .map(
                (st, idx) => {
                  const studentName = st.fullName || st.name || '—';
                  return `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(studentName)}</strong></td>
            <td style="font-weight: 700; text-align: center; color: #000000;">${Math.round(st.percentage)}%</td>
            <td style="text-align: center;"><span class="badge-alert">CRITICAL WARNING</span></td>
          </tr>
        `;
                }
              )
              .join('')
      }
    </tbody>
  </table>

  ${
    data.students && data.students.length > 0
      ? `
  <div class="section-title" style="margin-top: 20px;">Complete Student Attendance Ledger</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Student Name</th>
        <th>Roll No / USN</th>
        <th style="text-align: center;">Days Present</th>
        <th style="text-align: center;">Total Days</th>
        <th style="text-align: center;">Attendance %</th>
        <th style="text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.students
        .map((st, idx) => {
          const studentName = st.fullName || st.name || '—';
          const rollNo = st.rollNoOrUSN || '—';
          const pct = Math.round(st.percentage);
          const isGood = pct >= 75;
          return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(studentName)}</strong></td>
          <td>${escapeHtml(rollNo)}</td>
          <td style="text-align: center;">${st.present ?? '—'}</td>
          <td style="text-align: center;">${st.total ?? '—'}</td>
          <td style="text-align: center; font-weight: 700; color: #000000;">${pct}%</td>
          <td style="text-align: center;">
            <span class="${isGood ? 'badge-status' : 'badge-alert'}">${isGood ? 'REGULAR' : 'DEFAULTER'}</span>
          </td>
        </tr>
      `;
        })
        .join('')}
    </tbody>
  </table>`
      : ''
  }

  <div class="footer">
    <div>${escapeHtml(institutionName)} • Teacher Class Attendance Module</div>
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

