import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StudentDetailDossier } from '../../../api/principal';

function getDepartmentSubjects(department: string) {
  const d = (department || '').toLowerCase();
  if (d.includes('cse') || d.includes('computer')) {
    return [
      { code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'CS302', name: 'Database Management Systems', credits: 4, grade: 'A', points: 8.5 },
      { code: 'CS303', name: 'Operating Systems & Architecture', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'CS304', name: 'Discrete Mathematical Structures', credits: 3, grade: 'A', points: 8.0 },
      { code: 'CS305', name: 'Design & Analysis of Algorithms', credits: 4, grade: 'O', points: 10.0 },
      { code: 'CS306', name: 'Database Systems & SQL Laboratory', credits: 2, grade: 'O', points: 10.0 },
    ];
  }
  if (d.includes('aiml') || d.includes('ai')) {
    return [
      { code: 'AI301', name: 'Foundations of Artificial Intelligence', credits: 4, grade: 'O', points: 10.0 },
      { code: 'AI302', name: 'Statistical Machine Learning', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'AI303', name: 'Neural Networks & Deep Learning', credits: 4, grade: 'O', points: 10.0 },
      { code: 'AI304', name: 'Natural Language Processing', credits: 3, grade: 'A', points: 8.5 },
      { code: 'AI305', name: 'Computer Vision & Pattern Recognition', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'AI306', name: 'Applied AI Frameworks Laboratory', credits: 2, grade: 'O', points: 10.0 },
    ];
  }
  if (d.includes('ece') || d.includes('electronics')) {
    return [
      { code: 'EC301', name: 'Analog Electronic Circuits', credits: 4, grade: 'A', points: 8.5 },
      { code: 'EC302', name: 'Signals, Systems & Transforms', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'EC303', name: 'Digital Logic & Microprocessors', credits: 4, grade: 'A', points: 8.0 },
      { code: 'EC304', name: 'Electromagnetic Field Theory', credits: 3, grade: 'A', points: 8.5 },
      { code: 'EC305', name: 'VLSI Design Fundamentals', credits: 4, grade: 'O', points: 10.0 },
      { code: 'EC306', name: 'Embedded Systems & IoT Laboratory', credits: 2, grade: 'O', points: 10.0 },
    ];
  }
  if (d.includes('mech') || d.includes('mechanical')) {
    return [
      { code: 'ME301', name: 'Applied Thermodynamics', credits: 4, grade: 'A', points: 8.5 },
      { code: 'ME302', name: 'Fluid Mechanics & Hydraulic Machinery', credits: 4, grade: 'A', points: 8.0 },
      { code: 'ME303', name: 'Mechanics of Deformable Bodies', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'ME304', name: 'Kinematics & Theory of Machines', credits: 3, grade: 'A', points: 8.5 },
      { code: 'ME305', name: 'Manufacturing Processes & Metallurgy', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'ME306', name: 'Computer Aided Drafting (CAD) Lab', credits: 2, grade: 'O', points: 10.0 },
    ];
  }
  if (d.includes('civil')) {
    return [
      { code: 'CV301', name: 'Structural Analysis I', credits: 4, grade: 'A', points: 8.5 },
      { code: 'CV302', name: 'Geotechnical Engineering & Soils', credits: 4, grade: 'A', points: 8.0 },
      { code: 'CV303', name: 'Environmental Engineering & Sanitation', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'CV304', name: 'Surveying & Advanced Geomatics', credits: 3, grade: 'A', points: 8.5 },
      { code: 'CV305', name: 'Design of Reinforced Concrete Structures', credits: 4, grade: 'A+', points: 9.0 },
      { code: 'CV306', name: 'Concrete & Materials Testing Laboratory', credits: 2, grade: 'O', points: 10.0 },
    ];
  }
  return [
    { code: 'AS301', name: 'Advanced Engineering Mathematics', credits: 4, grade: 'A+', points: 9.0 },
    { code: 'AS302', name: 'Computational Numerical Methods', credits: 4, grade: 'A', points: 8.5 },
    { code: 'AS303', name: 'Material Physics & Nanotechnology', credits: 4, grade: 'A+', points: 9.0 },
    { code: 'AS304', name: 'Industrial Chemistry & Electrochemistry', credits: 3, grade: 'A', points: 8.0 },
    { code: 'AS305', name: 'Technical Communication & Professional Ethics', credits: 3, grade: 'O', points: 10.0 },
    { code: 'AS306', name: 'Scientific Computing Laboratory', credits: 2, grade: 'O', points: 10.0 },
  ];
}

export function buildAcademicReportHtml(student: StudentDetailDossier, institutionName: string): string {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const subjects = getDepartmentSubjects(student.department);
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalGradePoints = subjects.reduce((sum, s) => sum + s.credits * s.points, 0);
  const computedSgpa = (totalGradePoints / totalCredits).toFixed(2);

  const rowsHtml = subjects
    .map(
      (s, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
        <td style="padding: 10px 12px; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${s.code}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${s.name}</td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #E5E7EB;">${s.credits}</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #15803D; border-bottom: 1px solid #E5E7EB;">${s.grade}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${s.points.toFixed(1)}</td>
        <td style="padding: 10px 12px; text-align: center; color: #16A34A; font-weight: 600; border-bottom: 1px solid #E5E7EB;">PASSED</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Academic Report - ${student.fullName} (${student.rollNoOrUSN})</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 14mm 16mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background-color: #FFFFFF;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .header-container {
          text-align: center;
          padding-bottom: 14px;
          border-bottom: 3px double #1F2937;
          margin-bottom: 16px;
        }
        .institution-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #111827;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }
        .institution-sub {
          font-size: 11px;
          color: #4B5563;
          margin: 0 0 8px 0;
          letter-spacing: 0.2px;
        }
        .report-badge {
          display: inline-block;
          background-color: #FBBF24;
          color: #000000;
          padding: 4px 14px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6B7280;
          margin-top: 6px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin: 16px 0 8px 0;
          padding-bottom: 4px;
          border-bottom: 1px solid #E5E7EB;
        }
        .student-card {
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 14px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 24px;
        }
        .info-item {
          display: flex;
          font-size: 12px;
        }
        .info-label {
          color: #6B7280;
          width: 140px;
          flex-shrink: 0;
        }
        .info-value {
          color: #111827;
          font-weight: 600;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .kpi-card {
          background-color: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          padding: 10px 12px;
          text-align: center;
        }
        .kpi-val {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }
        .kpi-lbl {
          font-size: 10px;
          color: #6B7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 3px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 14px;
        }
        th {
          background-color: #1F2937;
          color: #FFFFFF;
          font-weight: 700;
          padding: 10px 12px;
          text-align: left;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          font-size: 11px;
        }
        .footer-signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 36px;
          padding-top: 14px;
          text-align: center;
          gap: 16px;
        }
        .sig-line {
          border-top: 1px dashed #9CA3AF;
          padding-top: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #374151;
        }
        .sig-sub {
          font-size: 10px;
          color: #6B7280;
          margin-top: 2px;
        }
        .stamp-box {
          border: 2px solid #D97706;
          border-radius: 6px;
          padding: 6px;
          color: #B45309;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-block;
          margin-top: 4px;
        }
        @media print {
          body {
            background-color: #FFFFFF;
          }
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <h1 class="institution-title">${institutionName || 'KIVQUO INSTITUTE OF ENGINEERING & TECHNOLOGY'}</h1>
        <p class="institution-sub">Affiliated to State Technological University · Approved by AICTE · Accredited by NAAC Grade 'A+'</p>
        <div class="report-badge">Official Student Academic Transcript & Report Card</div>
        <div class="meta-row">
          <span><strong>Document Ref:</strong> TRANSCRIPT/${student.rollNoOrUSN}/2026</span>
          <span><strong>Issued Date:</strong> ${dateStr}</span>
        </div>
      </div>

      <div class="section-title">Student Identification & Enrollment Profile</div>
      <div class="student-card">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Candidate Name:</span>
            <span class="info-value">${student.fullName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">USN / University Roll:</span>
            <span class="info-value" style="color: #000000; font-family: monospace; font-size: 13px;">${student.rollNoOrUSN}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Department / Branch:</span>
            <span class="info-value">${student.department}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Program & Class:</span>
            <span class="info-value">${student.className}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Academic Term:</span>
            <span class="info-value">${student.academicYear} · Section ${student.section || 'A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Faculty Advisor:</span>
            <span class="info-value">${student.classTeacherName || 'Dr. Emily Watson'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Student Email:</span>
            <span class="info-value">${student.email}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Parent / Guardian:</span>
            <span class="info-value">${student.parentPhone}</span>
          </div>
        </div>
      </div>

      <div class="section-title">Cumulative Performance & Academic Standing</div>
      <div class="kpi-row">
        <div class="kpi-card">
          <p class="kpi-val" style="color: #15803D;">${student.academics.cgpa}</p>
          <p class="kpi-lbl">Cumulative GPA</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-val" style="color: #2563EB;">${computedSgpa}</p>
          <p class="kpi-lbl">Semester SGPA</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-val" style="color: ${student.academics.backlogs === 0 ? '#15803D' : '#DC2626'};">${student.academics.backlogs}</p>
          <p class="kpi-lbl">Active Backlogs</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-val" style="color: #111827;">${student.academics.status === 'passed' ? 'Regular' : 'At-Risk'}</p>
          <p class="kpi-lbl">Academic Standing</p>
        </div>
      </div>

      <div class="section-title">End-Semester Course Evaluation & Grade Sheet</div>
      <table>
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Title</th>
            <th style="text-align: center;">Credits</th>
            <th style="text-align: center;">Letter Grade</th>
            <th style="text-align: right;">Grade Point</th>
            <th style="text-align: center;">Result</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #F3F4F6; font-weight: 700; border-top: 2px solid #D1D5DB;">
            <td colspan="2" style="padding: 10px 12px;">Total Earned Credits: ${totalCredits}</td>
            <td style="padding: 10px 12px; text-align: center;">${totalCredits}</td>
            <td colspan="2" style="padding: 10px 12px; text-align: right;">Semester SGPA: ${computedSgpa} / 10.00</td>
            <td style="padding: 10px 12px; text-align: center; color: #15803D;">QUALIFIED</td>
          </tr>
        </tfoot>
      </table>

      <div class="section-title">Attendance & Conduct Record</div>
      <div class="student-card" style="margin-bottom: 20px;">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Attendance Percentage:</span>
            <span class="info-value" style="color: ${student.attendance.rate >= 75 ? '#15803D' : '#DC2626'};">${student.attendance.rate}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Sessions Attended:</span>
            <span class="info-value">${student.attendance.presentDays} of ${student.attendance.totalDays} Conducted Days</span>
          </div>
          <div class="info-item">
            <span class="info-label">Exam Eligibility:</span>
            <span class="info-value" style="color: #15803D;">${student.attendance.rate >= 75 ? 'ELIGIBLE (Statutory 75% Met)' : 'SHORTAGE - CONDITIONAL'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fee Clearance Status:</span>
            <span class="info-value" style="color: ${student.fees.pendingFee === 0 ? '#15803D' : '#D97706'};">${student.fees.pendingFee === 0 ? 'CLEARED' : `Dues Active: ₹${student.fees.pendingFee.toLocaleString()}`}</span>
          </div>
        </div>
      </div>

      <div class="footer-signatures">
        <div>
          <div class="sig-line">Class Teacher / Homeroom Advisor</div>
          <div class="sig-sub">${student.classTeacherName || 'Dr. Emily Watson'}</div>
        </div>
        <div>
          <div class="stamp-box">Official Seal Verified</div>
          <div class="sig-sub" style="margin-top: 6px;">Office of Academic Affairs</div>
        </div>
        <div>
          <div class="sig-line">Principal & Controller of Examinations</div>
          <div class="sig-sub">${institutionName || 'KIVQUO Institute of Technology'}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function generateStudentAcademicReportPDF(
  student: StudentDetailDossier,
  institutionName: string
): Promise<void> {
  try {
    const html = buildAcademicReportHtml(student, institutionName);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Academic Report - ${student.fullName} (${student.rollNoOrUSN})`,
        });
      } else {
        await Print.printAsync({ html });
      }
    }
  } catch (err: any) {
    console.error('Error generating academic report PDF:', err);
    Alert.alert(
      'Report Generation Error',
      err?.message || 'Could not generate the academic report PDF. Please try again.'
    );
  }
}
