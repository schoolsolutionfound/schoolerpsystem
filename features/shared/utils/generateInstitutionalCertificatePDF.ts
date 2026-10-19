import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DocumentRequest, DOCUMENT_TYPE_CONFIG } from '../types/documentRequest.types';

function buildCertificateHtml(
  request: DocumentRequest,
  institutionName: string = 'APEX INSTITUTE OF SCIENCE & TECHNOLOGY'
): string {
  const cfg = DOCUMENT_TYPE_CONFIG[request.documentType];
  const certNumber = request.certificateNumber || `INST/${cfg.prefix}/${new Date().getFullYear()}/${request.requestNumber.replace('DOC-', '')}`;
  const issueDate = request.generatedDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const academicYear = request.academicDetails?.academicYear || '2025 - 2026';
  const semester = request.academicDetails?.semester || request.classOrSemester || 'Semester V';

  // Specific bodies per document type
  let specificBodyHtml = '';

  if (request.documentType === 'marks_card') {
    const courses = request.academicDetails?.courses || [
      { code: 'CS501', name: 'Design and Analysis of Algorithms', credits: 4, marksObtained: 88, maxMarks: 100, grade: 'A+', gradePoints: 9.0 },
      { code: 'CS502', name: 'Database Management Systems & SQL', credits: 4, marksObtained: 92, maxMarks: 100, grade: 'O', gradePoints: 10.0 },
      { code: 'CS503', name: 'Operating Systems & System Kernel', credits: 4, marksObtained: 84, maxMarks: 100, grade: 'A', gradePoints: 8.5 },
      { code: 'CS504', name: 'Automata Theory & Computability', credits: 3, marksObtained: 79, maxMarks: 100, grade: 'A', gradePoints: 8.0 },
      { code: 'CS505', name: 'Software Engineering & Agile Methodologies', credits: 3, marksObtained: 90, maxMarks: 100, grade: 'O', gradePoints: 10.0 },
      { code: 'CS506L', name: 'Database & Algorithms Laboratory', credits: 2, marksObtained: 96, maxMarks: 100, grade: 'O', gradePoints: 10.0 },
    ];
    const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
    const totalMarks = courses.reduce((acc, c) => acc + c.marksObtained, 0);
    const maxMarks = courses.reduce((acc, c) => acc + c.maxMarks, 0);
    const sgpa = request.academicDetails?.sgpa || 9.12;
    const cgpa = request.academicDetails?.cgpa || 8.94;

    const courseRows = courses.map((c, i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td style="font-weight: 600;">${c.code}</td>
        <td>${c.name}</td>
        <td style="text-align: center;">${c.credits}</td>
        <td style="text-align: center;">${c.maxMarks}</td>
        <td style="text-align: center; font-weight: 600;">${c.marksObtained}</td>
        <td style="text-align: center; font-weight: 700; color: #1e3a8a;">${c.grade}</td>
        <td style="text-align: center;">${c.gradePoints.toFixed(1)}</td>
      </tr>
    `).join('');

    specificBodyHtml = `
      <div class="marks-summary-bar">
        <div class="summary-col">
          <span class="label">SEMESTER</span>
          <span class="val">${semester}</span>
        </div>
        <div class="summary-col">
          <span class="label">ACADEMIC YEAR</span>
          <span class="val">${academicYear}</span>
        </div>
        <div class="summary-col">
          <span class="label">TOTAL CREDITS</span>
          <span class="val">${totalCredits}</span>
        </div>
        <div class="summary-col">
          <span class="label">SGPA</span>
          <span class="val highlighted">${sgpa.toFixed(2)}</span>
        </div>
        <div class="summary-col">
          <span class="label">CGPA</span>
          <span class="val highlighted">${cgpa.toFixed(2)}</span>
        </div>
        <div class="summary-col">
          <span class="label">RESULT</span>
          <span class="val" style="color: #059669; font-weight: 800;">FIRST CLASS WITH DISTINCTION</span>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 15%;">Course Code</th>
            <th style="width: 40%;">Course Title</th>
            <th style="width: 8%;">Credits</th>
            <th style="width: 8%;">Max</th>
            <th style="width: 8%;">Obt</th>
            <th style="width: 8%;">Grade</th>
            <th style="width: 8%;">Grade Pt</th>
          </tr>
        </thead>
        <tbody>
          ${courseRows}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; font-weight: 700;">TOTAL MARKS / CREDITS</td>
            <td style="text-align: center; font-weight: 700;">${totalCredits}</td>
            <td style="text-align: center; font-weight: 700;">${maxMarks}</td>
            <td style="text-align: center; font-weight: 700; color: #1e3a8a;">${totalMarks}</td>
            <td colspan="2" style="text-align: center; font-weight: 700;">${((totalMarks / maxMarks) * 100).toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (request.documentType === 'hall_ticket') {
    const examCenter = request.academicDetails?.examCenter || 'Campus Main Block, Auditorium Hall A';
    specificBodyHtml = `
      <div class="hall-ticket-grid">
        <div class="ht-info-col">
          <div class="ht-row"><span class="ht-label">Examination:</span> <span class="ht-val">End Semester Regular Examinations (${academicYear})</span></div>
          <div class="ht-row"><span class="ht-label">Candidate Name:</span> <span class="ht-val" style="font-weight: 800; color: #111827;">${request.studentName}</span></div>
          <div class="ht-row"><span class="ht-label">University Seat No (USN):</span> <span class="ht-val" style="font-family: monospace; font-size: 15px; font-weight: 800; color: #1e3a8a;">${request.rollNoOrUSN}</span></div>
          <div class="ht-row"><span class="ht-label">Branch & Semester:</span> <span class="ht-val">${request.department} — ${semester}</span></div>
          <div class="ht-row"><span class="ht-label">Allotted Examination Center:</span> <span class="ht-val">${examCenter}</span></div>
        </div>
        <div class="ht-photo-col">
          <div class="photo-box">
            <div style="font-size: 32px; color: #9ca3af; margin-bottom: 4px;">👤</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">AFFIXED STUDENT PHOTO</div>
            <div style="font-size: 9px; color: #059669; font-weight: 700; margin-top: 4px;">VERIFIED & ACTIVE</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 14px; font-weight: 700; font-size: 12px; color: #374151; letter-spacing: 0.5px; text-transform: uppercase;">Examination Schedule & Course Allotment</div>
      <table class="data-table" style="margin-top: 8px;">
        <thead>
          <tr>
            <th style="width: 15%;">Date</th>
            <th style="width: 18%;">Time</th>
            <th style="width: 15%;">Course Code</th>
            <th style="width: 32%;">Course Title</th>
            <th style="width: 20%;">Invigilator Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 600;">02-Dec-2026</td>
            <td>09:30 AM - 12:30 PM</td>
            <td style="font-weight: 600;">CS501</td>
            <td>Design & Analysis of Algorithms</td>
            <td style="height: 38px;"></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">05-Dec-2026</td>
            <td>09:30 AM - 12:30 PM</td>
            <td style="font-weight: 600;">CS502</td>
            <td>Database Management Systems</td>
            <td style="height: 38px;"></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">09-Dec-2026</td>
            <td>09:30 AM - 12:30 PM</td>
            <td style="font-weight: 600;">CS503</td>
            <td>Operating Systems & Architecture</td>
            <td style="height: 38px;"></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">12-Dec-2026</td>
            <td>09:30 AM - 12:30 PM</td>
            <td style="font-weight: 600;">CS504</td>
            <td>Automata Theory & Computability</td>
            <td style="height: 38px;"></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">16-Dec-2026</td>
            <td>09:30 AM - 12:30 PM</td>
            <td style="font-weight: 600;">CS505</td>
            <td>Software Engineering</td>
            <td style="height: 38px;"></td>
          </tr>
        </tbody>
      </table>

      <div class="rules-box">
        <div style="font-weight: 700; margin-bottom: 4px; font-size: 11px; color: #b91c1c;">IMPORTANT CANDIDATE INSTRUCTIONS:</div>
        <ol style="margin: 0; padding-left: 18px; font-size: 10px; color: #4b5563; line-height: 1.5;">
          <li>Candidates must enter the examination hall at least 15 minutes prior to the commencement of the exam.</li>
          <li>Possession of mobile phones, smartwatches, or unauthorized study material is strictly prohibited.</li>
          <li>Candidates must carry this original Hall Ticket along with valid Institutional Identity Card on all exam days.</li>
        </ol>
      </div>
    `;
  } else if (request.documentType === 'transfer_certificate') {
    specificBodyHtml = `
      <div class="cert-body-text">
        <p>This is to certify that the particulars furnished below are in accordance with the institutional admission register and official records maintained at this institute:</p>
      </div>

      <table class="tc-table">
        <tr>
          <td class="tc-q">1. Name of the Student (in full):</td>
          <td class="tc-a" style="font-weight: 700; color: #111827;">${request.studentName.toUpperCase()}</td>
        </tr>
        <tr>
          <td class="tc-q">2. Institutional Roll No / USN:</td>
          <td class="tc-a" style="font-family: monospace; font-weight: 700; color: #1e3a8a;">${request.rollNoOrUSN}</td>
        </tr>
        <tr>
          <td class="tc-q">3. Department / Discipline:</td>
          <td class="tc-a">${request.department}</td>
        </tr>
        <tr>
          <td class="tc-q">4. Date of Admission into Institute:</td>
          <td class="tc-a">${request.academicDetails?.admissionDate || '18-Aug-2022'}</td>
        </tr>
        <tr>
          <td class="tc-q">5. Class / Semester from which Leaving:</td>
          <td class="tc-a">${semester} (${academicYear})</td>
        </tr>
        <tr>
          <td class="tc-q">6. Whether qualified for promotion to higher class:</td>
          <td class="tc-a" style="font-weight: 600;">YES — COURSE OF STUDY COMPLETED</td>
        </tr>
        <tr>
          <td class="tc-q">7. Whether all College / Hostel dues are paid:</td>
          <td class="tc-a" style="color: #059669; font-weight: 700;">YES — NO OUTSTANDING DUES (CLEARED)</td>
        </tr>
        <tr>
          <td class="tc-q">8. Reason for leaving the Institute:</td>
          <td class="tc-a">${request.purpose || 'Course Completed / Higher Studies Admission'}</td>
        </tr>
        <tr>
          <td class="tc-q">9. General Conduct and Character:</td>
          <td class="tc-a" style="font-weight: 700; color: #059669;">EXEMPLARY & SATISFACTORY</td>
        </tr>
        <tr>
          <td class="tc-q">10. Date of Application for Certificate:</td>
          <td class="tc-a">${request.appliedDate}</td>
        </tr>
        <tr>
          <td class="tc-q">11. Date of Issue of Certificate:</td>
          <td class="tc-a" style="font-weight: 600;">${issueDate}</td>
        </tr>
      </table>
    `;
  } else if (request.documentType === 'study_certificate') {
    specificBodyHtml = `
      <div class="bonafide-container">
        <div class="salutation">TO WHOMSOEVER IT MAY CONCERN</div>
        
        <div class="bonafide-statement">
          This is to solemnly certify that <span class="highlight-name">${request.studentName}</span>, 
          bearing University Seat Number / Roll No: <span class="highlight-code">${request.rollNoOrUSN}</span>, 
          is a bona fide and regular student of <span style="font-weight: 700;">${institutionName}</span>.
        </div>

        <div class="bonafide-statement">
          The candidate is presently pursuing the Bachelor of Engineering / Technology Degree Program in the Department of 
          <span style="font-weight: 700; color: #1e3a8a;">${request.department}</span> (${semester}), 
          during the Academic Year <span style="font-weight: 700;">${academicYear}</span>.
        </div>

        <div class="bonafide-statement">
          As per institutional records, the candidate's medium of instruction and examination is <span style="font-weight: 700;">ENGLISH</span>. 
          The candidate bears a good moral character and satisfactory academic record.
        </div>

        <div class="purpose-clause">
          This certificate is issued upon the candidate's specific request for the purpose of: 
          <strong>${request.purpose || 'Scholarship / Passport Application / Official Verification'}</strong>.
        </div>
      </div>
    `;
  } else if (request.documentType === 'conduct_certificate') {
    specificBodyHtml = `
      <div class="bonafide-container">
        <div class="salutation">CERTIFICATE OF CHARACTER & CONDUCT</div>
        
        <div class="bonafide-statement">
          This is to certify that <span class="highlight-name">${request.studentName}</span>, 
          bearing Roll No / USN: <span class="highlight-code">${request.rollNoOrUSN}</span>, 
          has been a bonafide student of this institution in the Department of 
          <span style="font-weight: 700;">${request.department}</span> from 
          <span style="font-weight: 600;">August 2022</span> to <span style="font-weight: 600;">Current Session</span>.
        </div>

        <div class="bonafide-statement">
          During their period of study at this institute, they have maintained exemplary discipline, 
          active participation in curricular activities, and commendable respect towards faculty members and fellow peers.
        </div>

        <div class="bonafide-statement">
          To the best of our knowledge and belief, they bear an <span style="font-weight: 800; color: #059669;">EXEMPLARY MORAL CHARACTER</span> 
          and have not been involved in any disciplinary irregularities. We wish them all success in their future endeavors.
        </div>

        <div class="purpose-clause">
          Purpose: <strong>${request.purpose || 'Higher Education Admission / Employment Verification'}</strong>.
        </div>
      </div>
    `;
  } else if (request.documentType === 'fee_clearance') {
    specificBodyHtml = `
      <div class="bonafide-container">
        <div class="salutation">NO DUES & FEE CLEARANCE CERTIFICATE</div>
        
        <div class="bonafide-statement">
          This is to officially certify that <span class="highlight-name">${request.studentName}</span> 
          (USN / Roll No: <span class="highlight-code">${request.rollNoOrUSN}</span>), student of 
          <span style="font-weight: 700;">${request.department}</span> (${semester}), 
          has cleared all dues and financial liabilities payable to the institution for the Academic Year 
          <span style="font-weight: 700;">${academicYear}</span>.
        </div>

        <table class="data-table" style="margin: 18px 0;">
          <thead>
            <tr>
              <th>Department / Section</th>
              <th>Liability Status</th>
              <th>Authorized Signatory / Verification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Academic Tuition & Development Fee</td>
              <td style="color: #059669; font-weight: 700;">CLEARED (NIL DUE)</td>
              <td>Finance Accounts Office</td>
            </tr>
            <tr>
              <td>Central & Departmental Library</td>
              <td style="color: #059669; font-weight: 700;">ALL BOOKS RETURNED (NIL)</td>
              <td>Chief Librarian</td>
            </tr>
            <tr>
              <td>Department Laboratories & Workshop</td>
              <td style="color: #059669; font-weight: 700;">EQUIPMENT CLEARED (NIL)</td>
              <td>Head of Department (HOD)</td>
            </tr>
            <tr>
              <td>Campus Hostel & Mess Facilities</td>
              <td style="color: #059669; font-weight: 700;">CLEARED (NIL DUE)</td>
              <td>Chief Warden</td>
            </tr>
            <tr>
              <td>Examination & Assessment Cell</td>
              <td style="color: #059669; font-weight: 700;">ELIGIBLE & CLEARED</td>
              <td>Controller of Examinations</td>
            </tr>
          </tbody>
        </table>

        <div class="purpose-clause">
          Issued for the purpose of: <strong>${request.purpose || 'End Semester Hall Ticket / TC / Security Deposit Refund'}</strong>.
        </div>
      </div>
    `;
  } else {
    // Custom / Migration
    specificBodyHtml = `
      <div class="bonafide-container">
        <div class="salutation">INSTITUTIONAL ENDORSEMENT CERTIFICATE</div>
        
        <div class="bonafide-statement">
          This document certifies that <span class="highlight-name">${request.studentName}</span>, 
          bearing Roll No / USN: <span class="highlight-code">${request.rollNoOrUSN}</span>, 
          is a duly registered student in the Department of <span style="font-weight: 700;">${request.department}</span>.
        </div>

        <div class="bonafide-statement">
          ${request.studentRemarks || 'The institution has reviewed the application and issues this formal endorsement in support of the candidate.'}
        </div>

        <div class="purpose-clause">
          Application Purpose: <strong>${request.purpose || 'Official Certification'}</strong>.
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${cfg.label} - ${request.studentName}</title>
        <style>
          @page {
            size: A4;
            margin: 14mm 14mm 14mm 14mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            line-height: 1.5;
          }
          .cert-container {
            border: 3px double #1e3a8a;
            padding: 24px;
            position: relative;
            background: #ffffff;
            min-height: 980px;
          }
          .watermark {
            position: absolute;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 58pt;
            font-weight: 900;
            color: rgba(30, 58, 138, 0.04);
            white-space: nowrap;
            pointer-events: none;
            letter-spacing: 4px;
            text-transform: uppercase;
            z-index: 0;
          }
          .inner-content {
            position: relative;
            z-index: 1;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .crest-cell {
            width: 75px;
            vertical-align: middle;
            text-align: center;
          }
          .crest-emblem {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #1e3a8a;
            color: #f59e0b;
            font-size: 32px;
            line-height: 64px;
            text-align: center;
            font-weight: bold;
            margin: 0 auto;
          }
          .inst-name {
            font-size: 18pt;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: 0.5px;
            margin: 0;
            text-transform: uppercase;
          }
          .inst-sub {
            font-size: 9pt;
            color: #4b5563;
            margin-top: 2px;
            font-weight: 500;
          }
          .cert-badge-wrap {
            text-align: center;
            margin: 16px 0 14px 0;
          }
          .cert-title-badge {
            display: inline-block;
            background: #1e3a8a;
            color: #ffffff;
            font-size: 13pt;
            font-weight: 800;
            letter-spacing: 1.5px;
            padding: 6px 26px;
            border-radius: 4px;
            text-transform: uppercase;
            border-bottom: 3px solid #f59e0b;
          }
          .meta-strip {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 9pt;
          }
          .meta-item {
            color: #475569;
          }
          .meta-item strong {
            color: #0f172a;
          }
          .student-meta-card {
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 16px;
          }
          .student-meta-grid {
            width: 100%;
            border-collapse: collapse;
          }
          .student-meta-grid td {
            padding: 4px 6px;
            font-size: 9.5pt;
          }
          .sm-label {
            color: #64748b;
            font-weight: 600;
            width: 18%;
          }
          .sm-val {
            color: #0f172a;
            font-weight: 700;
            width: 32%;
          }
          /* Marks Table */
          .marks-summary-bar {
            display: flex;
            justify-content: space-around;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            text-align: center;
          }
          .summary-col .label {
            display: block;
            font-size: 7.5pt;
            font-weight: 700;
            color: #3b82f6;
            letter-spacing: 0.5px;
          }
          .summary-col .val {
            font-size: 10.5pt;
            font-weight: 700;
            color: #1e3a8a;
          }
          .summary-col .val.highlighted {
            color: #059669;
            font-size: 12pt;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 9pt;
          }
          .data-table th {
            background: #1e3a8a;
            color: #ffffff;
            text-align: left;
            padding: 7px 8px;
            font-weight: 700;
            font-size: 8.5pt;
            letter-spacing: 0.3px;
          }
          .data-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .data-table tr:nth-child(even) td {
            background: #f8fafc;
          }
          .total-row td {
            background: #f1f5f9 !important;
            border-top: 2px solid #cbd5e1;
          }
          /* Hall Ticket */
          .hall-ticket-grid {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            border: 1px solid #cbd5e1;
            padding: 12px;
            border-radius: 6px;
            background: #ffffff;
          }
          .ht-info-col {
            flex: 1;
          }
          .ht-row {
            margin-bottom: 6px;
            font-size: 9.5pt;
          }
          .ht-label {
            color: #64748b;
            font-weight: 600;
            display: inline-block;
            width: 180px;
          }
          .ht-photo-col {
            width: 120px;
            text-align: center;
          }
          .photo-box {
            border: 2px dashed #cbd5e1;
            height: 125px;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }
          .rules-box {
            margin-top: 14px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 10px;
          }
          /* TC Table */
          .tc-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 10pt;
          }
          .tc-table td {
            padding: 7px 10px;
            border-bottom: 1px dashed #cbd5e1;
          }
          .tc-q {
            color: #475569;
            width: 48%;
            font-weight: 500;
          }
          .tc-a {
            color: #0f172a;
            width: 52%;
          }
          /* Bonafide / Study Cert */
          .bonafide-container {
            padding: 16px 12px;
          }
          .salutation {
            text-align: center;
            font-size: 13pt;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: 1px;
            margin: 18px 0 24px 0;
            text-decoration: underline;
          }
          .bonafide-statement {
            font-size: 11pt;
            line-height: 1.8;
            color: #1f2937;
            text-align: justify;
            margin-bottom: 16px;
          }
          .highlight-name {
            font-weight: 800;
            color: #111827;
            text-decoration: underline;
            letter-spacing: 0.3px;
          }
          .highlight-code {
            font-family: monospace;
            font-weight: 800;
            color: #1e3a8a;
            background: #eff6ff;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .purpose-clause {
            margin-top: 24px;
            padding: 10px 14px;
            background: #f8fafc;
            border-left: 4px solid #1e3a8a;
            font-size: 10pt;
            color: #334155;
          }
          /* Signatures */
          .footer-sign-wrap {
            margin-top: 38px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 18px;
          }
          .sign-col {
            text-align: center;
            width: 180px;
          }
          .sign-line {
            border-top: 1.5px solid #0f172a;
            margin-top: 40px;
            padding-top: 6px;
            font-size: 9.5pt;
            font-weight: 700;
            color: #0f172a;
          }
          .sign-role {
            font-size: 8pt;
            color: #64748b;
          }
          .seal-col {
            text-align: center;
          }
          .seal-box {
            width: 90px;
            height: 90px;
            border: 2px dashed #94a3b8;
            border-radius: 50%;
            line-height: 90px;
            color: #94a3b8;
            font-size: 8pt;
            font-weight: 700;
            margin: 0 auto;
          }
          .security-disclaimer {
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 7.5pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="watermark">${cfg.shortLabel}</div>
          <div class="inner-content">
            <!-- Institutional Header -->
            <table class="header-table">
              <tr>
                <td class="crest-cell">
                  <div class="crest-emblem">🏛</div>
                </td>
                <td style="padding-left: 14px; vertical-align: middle;">
                  <div class="inst-name">${institutionName}</div>
                  <div class="inst-sub">Affiliated to State Technological University • Approved by AICTE • Accredited Grade 'A+' by NAAC</div>
                  <div class="inst-sub">University Campus, Knowledge City • Tel: +91 80 2345 6789 • Web: www.institution.edu.in</div>
                </td>
              </tr>
            </table>

            <!-- Certificate Title -->
            <div class="cert-badge-wrap">
              <div class="cert-title-badge">${cfg.label}</div>
            </div>

            <!-- Meta Reference Strip -->
            <div class="meta-strip">
              <div class="meta-item">Ref / Cert No: <strong>${certNumber}</strong></div>
              <div class="meta-item">Application No: <strong>${request.requestNumber}</strong></div>
              <div class="meta-item">Date of Issue: <strong>${issueDate}</strong></div>
            </div>

            <!-- Candidate Details Card -->
            <div class="student-meta-card">
              <table class="student-meta-grid">
                <tr>
                  <td class="sm-label">Candidate Name:</td>
                  <td class="sm-val" style="color: #1e3a8a;">${request.studentName}</td>
                  <td class="sm-label">University Roll / USN:</td>
                  <td class="sm-val" style="font-family: monospace;">${request.rollNoOrUSN}</td>
                </tr>
                <tr>
                  <td class="sm-label">Branch / Department:</td>
                  <td class="sm-val">${request.department}</td>
                  <td class="sm-label">Academic Program:</td>
                  <td class="sm-val">Bachelor of Engineering (B.E)</td>
                </tr>
              </table>
            </div>

            <!-- Specific Document Body Content -->
            ${specificBodyHtml}

            <!-- Signatures Block -->
            <div class="footer-sign-wrap">
              <div class="sign-col">
                <div class="sign-line">Prepared & Verified By</div>
                <div class="sign-role">Senior Academic Superintendent</div>
              </div>

              <div class="seal-col">
                <div class="seal-box">OFFICIAL SEAL</div>
              </div>

              <div class="sign-col">
                <div class="sign-line">Principal / Dean</div>
                <div class="sign-role">${institutionName}</div>
              </div>
            </div>

            <!-- Security Footer -->
            <div class="security-disclaimer">
              <div>This is an official computer-generated document issued under the seal of the Institute.</div>
              <div>System Verification Hash: ${request.id.slice(0, 12).toUpperCase()} • Page 1 of 1</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function generateAndShareCertificatePDF(
  request: DocumentRequest,
  institutionName: string = 'APEX INSTITUTE OF SCIENCE & TECHNOLOGY'
): Promise<void> {
  try {
    const html = buildCertificateHtml(request, institutionName);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `${DOCUMENT_TYPE_CONFIG[request.documentType].shortLabel} - ${request.studentName} (${request.rollNoOrUSN})`,
        });
      } else {
        await Print.printAsync({ html });
      }
    }
  } catch (err: any) {
    console.error('Error generating document certificate PDF:', err);
    Alert.alert(
      'Document Generation Error',
      err?.message || 'Could not generate the official document PDF. Please try again.'
    );
  }
}
