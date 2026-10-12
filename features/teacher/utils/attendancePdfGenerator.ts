import {
  escapeHtml,
  getInstitutionName,
  formatGeneratedDate,
  baseReportCss,
  buildHtmlDocument,
  sharePdf,
} from '../../shared/utils/pdf/pdfShared';

export interface ClassAttendanceStudentInput {
  name?: string;
  fullName?: string;
  rollNoOrUSN?: string;
  percentage: number;
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
  dailyTrend?: { date: string; percentage: number }[];
}

export async function generateClassAttendancePdfReport(data: ClassAttendancePdfInput): Promise<void> {
  const institutionName = getInstitutionName();

  const classSection =
    typeof data.classSection === 'object'
      ? data.classSection?.name || 'Class Section'
      : data.classSection || 'Class Section';

  const range =
    typeof data.range === 'object'
      ? `${data.range?.fromDate || ''} to ${data.range?.toDate || ''}`.trim() || 'Current Term'
      : data.range || 'Current Term';

  const summary = data.summary || {};
  const generatedDate = formatGeneratedDate();

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

  const attendanceExtraCss = `
    .badge-green { background: #D1FAE5; color: #065F46; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; }
    .badge-red { background: #FEE2E2; color: #991B1B; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; }
  `;

  const html = buildHtmlDocument({
    title: `Class Attendance Report - ${classSection}`,
    css: baseReportCss('#10B981') + attendanceExtraCss,
    content: `
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
    <div class="kpi-card" style="background: #EFF6FF; border-color: #BFDBFE;">
      <div class="kpi-label" style="color: #1E40AF;">Class Roster</div>
      <div class="kpi-val" style="color: #1E3A8A;">${totalStudents} Students</div>
    </div>
    <div class="kpi-card" style="background: #F0FDF4; border-color: #BBF7D0;">
      <div class="kpi-label" style="color: #166534;">Average Attendance</div>
      <div class="kpi-val" style="color: #14532D;">${avgPct}%</div>
    </div>
    ${
      hasPresentAbsentData
        ? `
    <div class="kpi-card" style="background: #FEF3C7; border-color: #FDE68A;">
      <div class="kpi-label" style="color: #B45309;">Present vs Absent</div>
      <div class="kpi-val" style="color: #78350F;">${presentCount} P / ${absentCount} A</div>
    </div>`
        : ''
    }
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
          ? `<tr><td colspan="4" style="text-align: center; color: #6B7280; padding: 12px;">No top performer records (&ge;90%) found.</td></tr>`
          : topList
              .map(
                (st, idx) => {
                  const studentName = st.fullName || st.name || '—';
                  return `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(studentName)}</strong></td>
            <td style="font-weight: 700; color: #059669;">${Math.round(st.percentage)}%</td>
            <td><span class="badge-green">EXCELLENT</span></td>
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
                (st, idx) => {
                  const studentName = st.fullName || st.name || '—';
                  return `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(studentName)}</strong></td>
            <td style="font-weight: 700; color: #DC2626;">${Math.round(st.percentage)}%</td>
            <td><span class="badge-red">CRITICAL WARNING</span></td>
          </tr>
        `;
                }
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="footer">
    <div>${escapeHtml(institutionName)} • Teacher Class Attendance Module</div>
    <div>Confidential — Official Academic Record</div>
  </div>
    `,
  });

  await sharePdf(html, `Download Attendance Report - ${classSection}`);
}

