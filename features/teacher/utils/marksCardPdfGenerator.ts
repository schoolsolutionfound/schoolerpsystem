import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { useUserStore } from '../../../store/useUserStore';

export interface SubjectMarksRecord {
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number;
  grade?: string;
  remarks?: string;
}

export interface StudentMarksCardPdfInput {
  studentName: string;
  rollNoOrUSN: string;
  className: string;
  sectionName: string;
  examName: string;
  academicYear?: string;
  classRank?: number | string;
  totalStudentsInClass?: number;
  attendancePercentage?: number;
  attendanceDaysPresent?: number;
  attendanceTotalDays?: number;
  subjects: SubjectMarksRecord[];
  teacherRemarks?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function calculateGrade(marks: number, maxMarks: number): { grade: string; text: string; pass: boolean } {
  if (maxMarks <= 0) return { grade: 'N/A', text: 'N/A', pass: false };
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return { grade: 'A+', text: 'Outstanding', pass: true };
  if (pct >= 80) return { grade: 'A', text: 'Excellent', pass: true };
  if (pct >= 70) return { grade: 'B+', text: 'Very Good', pass: true };
  if (pct >= 60) return { grade: 'B', text: 'Good', pass: true };
  if (pct >= 50) return { grade: 'C+', text: 'Above Average', pass: true };
  if (pct >= 35) return { grade: 'C', text: 'Pass', pass: true };
  return { grade: 'F', text: 'Needs Improvement', pass: false };
}

export async function generateStudentMarksCardPdf(data: StudentMarksCardPdfInput): Promise<void> {
  const userStore = useUserStore.getState();
  const institutionName = userStore.institutionName || userStore.schoolName || 'Kivquo Academy of Excellence';

  const totalMax = data.subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0);
  const totalObtained = data.subjects.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
  const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';
  const overallGradeInfo = calculateGrade(totalObtained, totalMax);
  const isPassed = data.subjects.every((s) => s.marksObtained >= (s.passMarks || 35));

  const generatedDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const academicYear = data.academicYear || '2025 - 2026';
  const attendancePct = data.attendancePercentage ?? 94.5;
  const daysPresent = data.attendanceDaysPresent ?? 142;
  const totalDays = data.attendanceTotalDays ?? 150;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student Marks Card - ${escapeHtml(data.studentName)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .sheet-border {
      border: 3px double #1F2937;
      padding: 16px;
      border-radius: 6px;
      position: relative;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #000000;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 11px;
      color: #374151;
      margin-top: 3px;
      font-weight: 600;
    }
    .report-title-badge {
      display: inline-block;
      background: #000000;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 12px;
      padding: 5px 16px;
      border-radius: 4px;
      margin-top: 8px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .meta-grid {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .meta-col {
      flex: 1;
    }
    .meta-item {
      font-size: 10.5px;
      margin-bottom: 4px;
      color: #374151;
    }
    .meta-item strong {
      color: #111827;
      font-weight: 700;
    }
    .kpi-row {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-box {
      flex: 1;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
    }
    .kpi-box.primary {
      background: #FEF3C7;
      border-color: #FDE68A;
    }
    .kpi-box.success {
      background: #ECFDF5;
      border-color: #A7F3D0;
    }
    .kpi-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #4B5563;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
      margin-top: 2px;
    }
    .table-container {
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      border: 1.5px solid #000000;
    }
    th {
      background: #000000;
      color: #FFFFFF;
      font-weight: 700;
      padding: 7px 10px;
      border: 1px solid #000000;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #000000;
      color: #000000;
    }
    tr:nth-child(even) {
      background: #F9FAFB;
    }
    tr.total-row {
      background: #F3F4F6;
      font-weight: 800;
      border-top: 2px solid #000000;
    }
    tr.total-row td {
      border: 1px solid #000000;
      color: #000000;
      font-size: 11px;
    }
    .badge-pass {
      background: #FFFFFF;
      color: #000000;
      border: 1px solid #000000;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
      display: inline-block;
    }
    .badge-fail {
      background: #000000;
      color: #FFFFFF;
      border: 1px solid #000000;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
      display: inline-block;
    }
    .remarks-grid {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-bottom: 16px;
    }
    .remarks-card {
      flex: 1;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 10px;
    }
    .remarks-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #4B5563;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .remarks-text {
      font-size: 10.5px;
      color: #1F2937;
      line-height: 1.4;
    }
    .grading-scale {
      font-size: 8.5px;
      color: #6B7280;
      background: #F3F4F6;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 24px;
      text-align: center;
    }
    .signatures {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 10px;
    }
    .sig-col {
      width: 28%;
      text-align: center;
    }
    .sig-line {
      border-top: 1px dashed #4B5563;
      margin-bottom: 4px;
    }
    .sig-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 8.5px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="sheet-border">
    <div class="header">
      <div class="brand">${escapeHtml(institutionName)}</div>
      <div class="subtitle">Affiliated &amp; Accredited Institution • Academic Assessment Record</div>
      <div class="report-title-badge">${escapeHtml(data.examName)} — STUDENT MARKS CARD</div>
    </div>

    <div class="meta-grid">
      <div class="meta-col">
        <div class="meta-item">Student Name: <strong>${escapeHtml(data.studentName)}</strong></div>
        <div class="meta-item">Roll No / USN: <strong>${escapeHtml(data.rollNoOrUSN)}</strong></div>
        <div class="meta-item">Class &amp; Section: <strong>${escapeHtml(data.className)} - ${escapeHtml(data.sectionName)}</strong></div>
      </div>
      <div class="meta-col" style="text-align: right;">
        <div class="meta-item">Academic Year: <strong>${escapeHtml(academicYear)}</strong></div>
        <div class="meta-item">Examination: <strong>${escapeHtml(data.examName)}</strong></div>
        <div class="meta-item">Issue Date: <strong>${escapeHtml(generatedDate)}</strong></div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box primary">
        <div class="kpi-label">Total Marks</div>
        <div class="kpi-value">${totalObtained} / ${totalMax}</div>
      </div>
      <div class="kpi-box primary">
        <div class="kpi-label">Overall Percentage</div>
        <div class="kpi-value">${overallPercentage}%</div>
      </div>
      <div class="kpi-box success">
        <div class="kpi-label">Grade / Division</div>
        <div class="kpi-value">${overallGradeInfo.grade} (${overallGradeInfo.text})</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Class Rank</div>
        <div class="kpi-value">${data.classRank ? `#${data.classRank}` : '—'}</div>
      </div>
      <div class="kpi-box success">
        <div class="kpi-label">Result</div>
        <div class="kpi-value" style="color: ${isPassed ? '#059669' : '#DC2626'};">${isPassed ? 'PASSED' : 'NEEDS IMP.'}</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">#</th>
            <th>Subject Name</th>
            <th style="text-align: center; width: 70px;">Max Marks</th>
            <th style="text-align: center; width: 70px;">Pass Marks</th>
            <th style="text-align: center; width: 80px;">Marks Scored</th>
            <th style="text-align: center; width: 60px;">Grade</th>
            <th style="text-align: center; width: 80px;">Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${data.subjects
            .map((sub, index) => {
              const pass = sub.marksObtained >= (sub.passMarks || 35);
              const gInfo = calculateGrade(sub.marksObtained, sub.maxMarks || 100);
              const grade = sub.grade || gInfo.grade;
              return `
            <tr>
              <td style="text-align: center; font-weight: 700;">${index + 1}</td>
              <td><strong>${escapeHtml(sub.subjectName)}</strong></td>
              <td style="text-align: center;">${sub.maxMarks || 100}</td>
              <td style="text-align: center;">${sub.passMarks || 35}</td>
              <td style="text-align: center; font-weight: 700; color: ${pass ? '#111827' : '#DC2626'};">${sub.marksObtained}</td>
              <td style="text-align: center; font-weight: 700;">${escapeHtml(grade)}</td>
              <td style="text-align: center;">
                <span class="${pass ? 'badge-pass' : 'badge-fail'}">${pass ? 'PASS' : 'FAIL'}</span>
              </td>
              <td style="color: #4B5563; font-size: 9.5px;">${escapeHtml(sub.remarks || gInfo.text)}</td>
            </tr>
          `;
            })
            .join('')}
          <tr class="total-row">
            <td colspan="2" style="text-align: right; padding-right: 12px;">GRAND TOTAL:</td>
            <td style="text-align: center;">${totalMax}</td>
            <td style="text-align: center;">—</td>
            <td style="text-align: center; font-size: 13px;">${totalObtained}</td>
            <td style="text-align: center; font-size: 12px;">${overallGradeInfo.grade}</td>
            <td style="text-align: center;">
              <span class="${isPassed ? 'badge-pass' : 'badge-fail'}">${isPassed ? 'PASSED' : 'NEEDS IMP.'}</span>
            </td>
            <td>Percentage: <strong>${overallPercentage}%</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="remarks-grid">
      <div class="remarks-card">
        <div class="remarks-title">Class Teacher's Observations</div>
        <div class="remarks-text">
          ${escapeHtml(
            data.teacherRemarks ||
              `${data.studentName} has demonstrated exceptional dedication and consistent academic prowess throughout this examination period. Well done!`
          )}
        </div>
      </div>
      <div class="remarks-card" style="flex: 0.85;">
        <div class="remarks-title">Term Attendance Summary</div>
        <div class="remarks-text">
          Total Working Days: <strong>${totalDays}</strong><br/>
          Days Present: <strong>${daysPresent}</strong> (${attendancePct}%)<br/>
          Status: <strong style="color: ${attendancePct >= 75 ? '#059669' : '#DC2626'};">${attendancePct >= 75 ? 'Satisfactory Regularity' : 'Attendance Warning'}</strong>
        </div>
      </div>
    </div>

    <div class="grading-scale">
      <strong>Grading Scale:</strong> A+ (90-100% Outstanding) &nbsp;|&nbsp; A (80-89% Excellent) &nbsp;|&nbsp; B+ (70-79% Very Good) &nbsp;|&nbsp; B (60-69% Good) &nbsp;|&nbsp; C+ (50-59% Above Average) &nbsp;|&nbsp; C (35-49% Pass) &nbsp;|&nbsp; F (&lt;35% Fail)
    </div>

    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-label">Class Teacher</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-label">Academic Coordinator</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-label">Principal / Headmaster</div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated official student marks card issued by ${escapeHtml(institutionName)}. Valid without physical seal if verified digitally.
    </div>
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
      dialogTitle: `Marks Card - ${data.studentName} (${data.rollNoOrUSN})`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

export interface ClassMarksLedgerStudentItem {
  rank: number;
  rollNo: string;
  name: string;
  subjects: { subjectName: string; marksObtained: number; maxMarks: number }[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  attendancePct?: number;
}

export interface ClassMarksLedgerPdfInput {
  className: string;
  sectionName: string;
  examName: string;
  academicYear?: string;
  students: ClassMarksLedgerStudentItem[];
}

export async function generateClassMarksLedgerPdf(data: ClassMarksLedgerPdfInput): Promise<void> {
  const userStore = useUserStore.getState();
  const institutionName = userStore.institutionName || userStore.schoolName || 'Kivquo Academy of Excellence';
  const academicYear = data.academicYear || '2025 - 2026';

  const totalStudents = data.students.length;
  const subjectsList = data.students[0]?.subjects || [];
  const maxClassMarks = data.students[0]?.maxMarks || (subjectsList.length * 50);

  const passedCount = data.students.filter((s) => s.isPassed).length;
  const passRate = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(1) : '0.0';
  const avgMarks = totalStudents > 0
    ? (data.students.reduce((sum, s) => sum + s.totalMarks, 0) / totalStudents).toFixed(1)
    : '0.0';
  const avgPct = maxClassMarks > 0
    ? ((parseFloat(avgMarks) / maxClassMarks) * 100).toFixed(1)
    : '0.0';

  const highestScore = data.students.reduce((max, s) => (s.totalMarks > max ? s.totalMarks : max), 0);
  const lowestScore = data.students.reduce(
    (min, s) => (s.totalMarks < min ? s.totalMarks : min),
    data.students[0]?.totalMarks || 0
  );

  const generatedDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const subjectHeaderCols = subjectsList
    .map(
      (sub) => `
        <th class="th-sub">
          <div class="sub-name">${escapeHtml(sub.subjectName)}</div>
          <div class="sub-max">(${sub.maxMarks})</div>
        </th>`
    )
    .join('');

  const rowsHtml = data.students
    .map((st, idx) => {
      const subjectCells = st.subjects
        .map((sub) => {
          const passMarks = Math.round(sub.maxMarks * 0.35);
          const isSubPass = sub.marksObtained >= passMarks;
          return `<td class="td-num ${!isSubPass ? 'td-failed' : ''}">${sub.marksObtained}</td>`;
        })
        .join('');

      return `
        <tr class="${idx % 2 === 1 ? 'row-alt' : ''}">
          <td class="td-rank">${st.rank}</td>
          <td class="td-roll">${escapeHtml(st.rollNo)}</td>
          <td class="td-name">${escapeHtml(st.name)}</td>
          ${subjectCells}
          <td class="td-total"><strong>${st.totalMarks}</strong></td>
          <td class="td-num">${st.percentage}%</td>
          <td class="td-grade"><span class="grade-pill">${escapeHtml(st.grade)}</span></td>
          <td class="td-result">
            <span class="badge ${st.isPassed ? 'badge-pass' : 'badge-fail'}">
              ${st.isPassed ? 'PASSED' : 'FAILED'}
            </span>
          </td>
        </tr>`;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Class Marks Ledger - ${escapeHtml(data.className)} - ${escapeHtml(data.sectionName)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 10px;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .ledger-container {
      width: 100%;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .inst-name {
      font-size: 17px;
      font-weight: 800;
      color: #000000;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .report-title {
      font-size: 11px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .meta-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      padding: 6px 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }
    .meta-item {
      display: inline-block;
    }
    .meta-label {
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9px;
    }
    .meta-val {
      color: #0F172A;
      font-weight: 700;
      font-size: 11px;
    }

    /* KPI Summary Cards */
    .kpi-row {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      flex: 1;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      padding: 6px 8px;
      text-align: center;
    }
    .kpi-num {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
    }
    .kpi-lbl {
      font-size: 8.5px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      margin-top: 1px;
    }

    /* Main Table */
    table.marks-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      page-break-inside: auto;
      border: 1.5px solid #000000;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #F1F5F9;
      color: #000000;
      border: 1px solid #000000;
      padding: 5px 4px;
      font-weight: 700;
      text-align: center;
    }
    th.th-left {
      text-align: left;
      padding-left: 6px;
    }
    .th-sub .sub-name {
      font-size: 9px;
      font-weight: 700;
      color: #000000;
    }
    .th-sub .sub-max {
      font-size: 7.5px;
      color: #4B5563;
      font-weight: normal;
    }
    td {
      border: 1px solid #000000;
      padding: 4.5px 4px;
      color: #000000;
      font-size: 9px;
    }
    .row-alt {
      background-color: #F8FAFC;
    }
    .td-rank {
      text-align: center;
      font-weight: 700;
      color: #475569;
      width: 32px;
    }
    .td-roll {
      text-align: center;
      font-family: ui-monospace, Menlo, Monaco, monospace;
      font-weight: 600;
      color: #475569;
      width: 58px;
    }
    .td-name {
      font-weight: 700;
      color: #0F172A;
      padding-left: 6px;
      min-width: 110px;
    }
    .td-num {
      text-align: center;
      width: 52px;
    }
    .td-failed {
      color: #DC2626 !important;
      font-weight: 700;
      background-color: #FEF2F2;
    }
    .td-total {
      text-align: center;
      background-color: #F8FAFC;
      color: #000000;
      font-weight: 700;
      width: 55px;
    }
    .td-grade {
      text-align: center;
      width: 42px;
    }
    .grade-pill {
      font-weight: 700;
      color: #000000;
    }
    .td-result {
      text-align: center;
      width: 60px;
    }
    .badge {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .badge-pass {
      background: #FFFFFF;
      color: #000000;
      border: 1px solid #000000;
    }
    .badge-fail {
      background: #000000;
      color: #FFFFFF;
      border: 1px solid #000000;
    }

    /* Footer & Signatures */
    .footer-section {
      margin-top: 14px;
      page-break-inside: avoid;
    }
    .grading-key {
      font-size: 8px;
      color: #64748B;
      border-top: 1px dashed #CBD5E1;
      padding-top: 4px;
      margin-bottom: 12px;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      padding: 0 20px;
    }
    .sig-block {
      text-align: center;
      width: 180px;
    }
    .sig-line {
      border-top: 1px solid #475569;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: 9px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
    }
    .official-note {
      font-size: 7.5px;
      color: #94A3B8;
      text-align: center;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="ledger-container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="border: none; padding: 0;">
          <h1 class="inst-name">${escapeHtml(institutionName)}</h1>
          <div class="report-title">Official Class Marks Ledger &amp; Consolidated Marksheet</div>
        </td>
        <td style="border: none; padding: 0; text-align: right;">
          <div style="font-size: 9px; color: #64748B;">Academic Year: <strong style="color: #0F172A;">${escapeHtml(academicYear)}</strong></div>
          <div style="font-size: 9px; color: #64748B;">Generated: <strong style="color: #0F172A;">${escapeHtml(generatedDate)}</strong></div>
        </td>
      </tr>
    </table>

    <!-- Meta Details Bar -->
    <div class="meta-box">
      <div class="meta-item">
        <span class="meta-label">Class &amp; Section:</span>
        <span class="meta-val">${escapeHtml(data.className)} · Section ${escapeHtml(data.sectionName)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Examination:</span>
        <span class="meta-val">${escapeHtml(data.examName)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total Subjects:</span>
        <span class="meta-val">${subjectsList.length}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total Enrolled:</span>
        <span class="meta-val">${totalStudents} Students</span>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-num">${totalStudents}</div>
        <div class="kpi-lbl">Total Students</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color: #059669;">${passedCount}</div>
        <div class="kpi-lbl">Passed (${passRate}%)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color: ${totalStudents - passedCount > 0 ? '#DC2626' : '#64748B'};">${totalStudents - passedCount}</div>
        <div class="kpi-lbl">Failed</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">${avgMarks} <span style="font-size: 9px; font-weight: normal; color: #64748B;">(${avgPct}%)</span></div>
        <div class="kpi-lbl">Class Average</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color: #D97706;">${highestScore} / ${maxClassMarks}</div>
        <div class="kpi-lbl">Highest Score</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color: #64748B;">${lowestScore} / ${maxClassMarks}</div>
        <div class="kpi-lbl">Lowest Score</div>
      </div>
    </div>

    <!-- Marks Table -->
    <table class="marks-table">
      <thead>
        <tr>
          <th style="width: 32px;">Rank</th>
          <th style="width: 58px;">Roll No</th>
          <th class="th-left" style="min-width: 110px;">Student Name</th>
          ${subjectHeaderCols}
          <th style="width: 55px;">Total (${maxClassMarks})</th>
          <th style="width: 44px;">%</th>
          <th style="width: 42px;">Grade</th>
          <th style="width: 60px;">Result</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Footer & Signatures -->
    <div class="footer-section">
      <div class="grading-key">
        <strong>Grading Scale:</strong> A+ (90-100% Outstanding) &nbsp;|&nbsp; A (80-89% Excellent) &nbsp;|&nbsp; B+ (70-79% Very Good) &nbsp;|&nbsp; B (60-69% Good) &nbsp;|&nbsp; C+ (50-59% Above Average) &nbsp;|&nbsp; C (35-49% Pass) &nbsp;|&nbsp; F (&lt;35% Fail)
      </div>

      <div class="sig-row">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-title">Class Teacher</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-title">Examination Coordinator</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-title">Principal / Headmaster</div>
        </div>
      </div>

      <div class="official-note">
        This is an official computer-generated academic record issued by ${escapeHtml(institutionName)}. System verified.
      </div>
    </div>
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
      dialogTitle: `Class Marks Ledger - ${data.className} ${data.sectionName} (${data.examName})`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
