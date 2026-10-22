import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Book, BookCopy, Loan, Fine, StudentProfile } from '../types';
import { useUserStore } from '../../../store/useUserStore';

export interface GeneratePdfOptions {
  reportType: string;
  timeRange: 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  students: StudentProfile[];
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds standard Indian-Rupee currency string preserving numeric sign.
 */
function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toFixed(2);
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Helper to filter arrays of records based on selected time range.
 */
function isWithinTimeRange(dateStr?: string | null, timeRange?: string): boolean {
  if (timeRange === 'ALL' || !timeRange) return true;
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  if (timeRange === 'MONTH') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= startOfMonth;
  }
  if (timeRange === 'QUARTER') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
    return date >= startOfQuarter;
  }
  if (timeRange === 'YEAR') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return date >= startOfYear;
  }
  return true;
}

function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Builds the complete HTML string for the PDF report with unified, simple format.
 */
function buildReportHtml(options: GeneratePdfOptions): string {
  const userStore = useUserStore.getState();
  const institutionName = userStore.institutionName || userStore.schoolName || 'School Library Management';

  const { reportType, timeRange, books, copies, students } = options;

  const filteredLoans = options.loans.filter((l) => isWithinTimeRange(l.issueDate || l.issuedAt || l.createdAt, timeRange));
  const filteredFines = options.fines.filter((f) => isWithinTimeRange(f.createdAt, timeRange));

  const periodLabelMap: Record<string, string> = {
    MONTH: 'This Month',
    QUARTER: 'This Quarter',
    YEAR: 'Academic Year',
    ALL: 'All Time',
  };
  const periodLabel = periodLabelMap[timeRange] || timeRange;
  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isOverdueReport = reportType.toLowerCase().includes('overdue');
  const isFinancialReport = reportType.toLowerCase().includes('fine') || reportType.toLowerCase().includes('financial');

  let reportTitle = 'Library Executive Summary Report';
  let reportSubtitle = 'Comprehensive overview of library circulation and popular titles';
  let contentHtml = '';

  if (isOverdueReport) {
    reportTitle = 'Library Overdue Loans Report';
    reportSubtitle = 'Official audit list of overdue book loans and pending returns';

    const overdueLoans = filteredLoans.filter(
      (l) => l.status === 'OVERDUE' || (l.status === 'ACTIVE' && new Date(l.dueDate) < new Date())
    );

    contentHtml = `
      <div class="section-title">Active and Overdue Books</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Member Name</th>
            <th>USN / Roll No</th>
            <th>Book Title</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Overdue By</th>
            <th style="width: 75px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            overdueLoans.length === 0
              ? `<tr><td colspan="8" class="empty-cell">No overdue loans found for the selected period. All books returned on time!</td></tr>`
              : overdueLoans
                  .map((loan, idx) => {
                    const student = students.find((s) => s.id === loan.studentId);
                    const book = books.find((b) => b.id === loan.bookId);
                    const days = getDaysOverdue(loan.dueDate);
                    return `
                      <tr>
                        <td style="text-align: center; color: #64748B;">${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong></td>
                        <td style="color: #64748B;">${escapeHtml(student?.admissionNo || ('ID: ' + loan.studentId))}</td>
                        <td>${escapeHtml(book?.title || 'Unknown Title')}</td>
                        <td>${loan.issueDate || loan.issuedAt ? escapeHtml(new Date(loan.issueDate || loan.issuedAt!).toLocaleDateString()) : '—'}</td>
                        <td style="font-weight: 600;">${escapeHtml(new Date(loan.dueDate).toLocaleDateString())}</td>
                        <td style="font-weight: 700; color: #DC2626;">${days} day${days !== 1 ? 's' : ''}</td>
                        <td style="text-align: center;"><span class="badge badge-overdue">OVERDUE</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    `;
  } else if (isFinancialReport) {
    reportTitle = 'Library Fine Receipts & Dues Ledger';
    reportSubtitle = 'Breakdown of collected library fine receipts and pending balances';

    contentHtml = `
      <div class="section-title">Fine Receipts Ledger</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Member Name</th>
            <th>USN / Roll No</th>
            <th>Fine Reason</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Balance Due</th>
            <th style="width: 75px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            filteredFines.length === 0
              ? `<tr><td colspan="8" class="empty-cell">No fine records registered for the selected period.</td></tr>`
              : filteredFines
                  .map((fine, idx) => {
                    const student = students.find((s) => s.id === fine.studentId);
                    const outstanding = fine.amount - (fine.paidAmount || 0);
                    const badgeClass = fine.status === 'PAID' ? 'badge-paid' : fine.status === 'WAIVED' ? 'badge-waived' : 'badge-unpaid';
                    return `
                      <tr>
                        <td style="text-align: center; color: #64748B;">${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong></td>
                        <td style="color: #64748B;">${escapeHtml(student?.admissionNo || ('ID: ' + fine.studentId))}</td>
                        <td>${escapeHtml(fine.fineType || fine.reason || 'Library Fine')}</td>
                        <td>${formatCurrency(fine.amount)}</td>
                        <td style="font-weight: 700; color: #026440;">${formatCurrency(fine.paidAmount || 0)}</td>
                        <td style="font-weight: 700; color: ${outstanding > 0 ? '#B91C1C' : '#111827'};">${formatCurrency(outstanding > 0 ? outstanding : 0)}</td>
                        <td style="text-align: center;"><span class="badge ${badgeClass}">${escapeHtml(fine.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    `;
  } else {
    // Top "Export Report" — Simple, Elegant Library Report
    reportTitle = 'Library Executive Summary Report';
    reportSubtitle = 'Official audit of active borrowings, overdue books, and popular literature';

    const activeLoansList = filteredLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');

    // Compute popular books dynamically with fallbacks
    const counts: { [bookId: string]: number } = {};
    filteredLoans.forEach((l) => {
      if (l.bookId) counts[l.bookId] = (counts[l.bookId] || 0) + 1;
    });

    let popularList = Object.keys(counts)
      .map((bId) => {
        const bk = books.find((b) => b.id === bId);
        return {
          id: bId,
          title: bk?.title || 'Unknown Title',
          subject: bk?.subject || 'General',
          count: counts[bId],
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (popularList.length === 0) {
      const allCounts: { [bookId: string]: number } = {};
      options.loans.forEach((l) => {
        if (l.bookId) allCounts[l.bookId] = (allCounts[l.bookId] || 0) + 1;
      });
      const allRanked = Object.keys(allCounts)
        .map((bId) => {
          const bk = books.find((b) => b.id === bId);
          return {
            id: bId,
            title: bk?.title || 'Unknown Title',
            subject: bk?.subject || 'General',
            count: allCounts[bId],
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (allRanked.length > 0) {
        popularList = allRanked;
      } else {
        popularList = books.slice(0, 5).map((bk) => ({
          id: bk.id,
          title: bk.title,
          subject: bk.subject || 'General',
          count: 0,
        }));
      }
    }

    contentHtml = `
      <!-- Section 1: Active and Overdue Books -->
      <div class="section-title">Active and Overdue Books</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Member Name</th>
            <th>USN / Roll No</th>
            <th>Book Title</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th style="width: 80px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            activeLoansList.length === 0
              ? `<tr><td colspan="7" class="empty-cell">No active or overdue books for this period.</td></tr>`
              : activeLoansList.slice(0, 20).map((loan, idx) => {
                  const student = students.find((s) => s.id === loan.studentId);
                  const book = books.find((b) => b.id === loan.bookId);
                  const isOverdue = loan.status === 'OVERDUE' || (new Date(loan.dueDate) < new Date() && loan.status !== 'RETURNED');
                  return `
                    <tr>
                      <td style="text-align: center; color: #64748B;">${idx + 1}</td>
                      <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong></td>
                      <td style="color: #64748B;">${escapeHtml(student?.admissionNo || loan.studentId)}</td>
                      <td>${escapeHtml(book?.title || 'Unknown Title')}</td>
                      <td>${loan.issueDate || loan.issuedAt ? escapeHtml(new Date(loan.issueDate || loan.issuedAt!).toLocaleDateString()) : '—'}</td>
                      <td style="font-weight: 600;">${escapeHtml(new Date(loan.dueDate).toLocaleDateString())}</td>
                      <td style="text-align: center;"><span class="badge ${isOverdue ? 'badge-overdue' : 'badge-issued'}">${isOverdue ? 'OVERDUE' : 'ACTIVE'}</span></td>
                    </tr>
                  `;
                }).join('')
          }
        </tbody>
      </table>

      <!-- Section 2: Popular Books -->
      <div class="section-title" style="margin-top: 24px;">Popular Books</div>
      <table>
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">Rank</th>
            <th>Book Title</th>
            <th>Subject / Category</th>
            <th style="width: 110px; text-align: center;">Total Borrows</th>
          </tr>
        </thead>
        <tbody>
          ${
            popularList.length === 0
              ? `<tr><td colspan="4" class="empty-cell">No popular book records available for this period.</td></tr>`
              : popularList.map((item, idx) => `
                  <tr>
                    <td style="text-align: center; font-weight: 700; color: #0F172A;">#${idx + 1}</td>
                    <td><strong>${escapeHtml(item.title)}</strong></td>
                    <td style="color: #475569;">${escapeHtml(item.subject)}</td>
                    <td style="text-align: center; font-weight: 700; color: #0F172A;">${item.count} borrow${item.count !== 1 ? 's' : ''}</td>
                  </tr>
                `).join('')
          }
        </tbody>
      </table>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #171717;
      background-color: #FFFFFF;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
    }
    .header-left {
      flex: 1;
    }
    .institution-name {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.8px;
      color: #0F172A;
    }
    .department-tag {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.6px;
      color: #D97706;
      margin-top: 2px;
      margin-bottom: 6px;
    }
    .report-title {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.2px;
    }
    .report-sub {
      font-size: 9.5px;
      color: #64748B;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      padding-left: 20px;
    }
    .meta-row {
      font-size: 9px;
      color: #64748B;
      margin-bottom: 3px;
    }
    .meta-label {
      font-weight: 600;
      color: #94A3B8;
      letter-spacing: 0.3px;
    }
    .meta-val {
      font-weight: 700;
      color: #0F172A;
      margin-left: 4px;
    }
    .header-line {
      height: 2px;
      background: #0F172A;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0F172A;
      margin-top: 14px;
      margin-bottom: 6px;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      border-left: 3px solid #F4C430;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10px;
      border: 1px solid #CBD5E1;
      border-radius: 0;
    }
    th {
      background-color: #F8FAFC;
      color: #0F172A;
      font-weight: 700;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #CBD5E1;
      border-radius: 0;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.4px;
    }
    td {
      padding: 7px 9px;
      border: 1px solid #E2E8F0;
      border-radius: 0;
      color: #1E293B;
      word-break: break-word;
      font-size: 9.5px;
    }
    tr:nth-child(even) {
      background-color: #F8FAFC;
    }
    .badge {
      display: inline-block;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 0;
      text-transform: uppercase;
      border: 1px solid transparent;
    }
    .badge-overdue {
      background-color: #FEF2F2;
      color: #DC2626;
      border-color: #F87171;
    }
    .badge-issued {
      background-color: #FEFCE8;
      color: #B45309;
      border-color: #FDE047;
    }
    .badge-paid {
      background-color: #ECFDF5;
      color: #026440;
      border-color: #026440;
    }
    .badge-unpaid {
      background-color: #FEF2F2;
      color: #B91C1C;
      border-color: #FCA5A5;
    }
    .badge-waived {
      background-color: #F3F4F6;
      color: #4B5563;
      border-color: #D1D5DB;
    }
    .empty-cell {
      text-align: center;
      color: #64748B;
      font-style: italic;
      padding: 16px;
    }
    .footer {
      margin-top: 28px;
      border-top: 1px solid #E2E8F0;
      padding-top: 10px;
      font-size: 9px;
      color: #64748B;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="institution-name">${escapeHtml(institutionName.toUpperCase())}</div>
      <div class="department-tag">CENTRAL LIBRARY MANAGEMENT SYSTEM</div>
      <div class="report-title">${escapeHtml(reportTitle)}</div>
      <div class="report-sub">${escapeHtml(reportSubtitle)}</div>
    </div>
    <div class="header-right">
      <div class="meta-row"><span class="meta-label">PERIOD:</span> <span class="meta-val">${escapeHtml(periodLabel.toUpperCase())}</span></div>
      <div class="meta-row"><span class="meta-label">DATE:</span> <span class="meta-val">${escapeHtml(generatedDate)}</span></div>
      <div class="meta-row"><span class="meta-label">STATUS:</span> <span class="meta-val" style="color: #026440;">VERIFIED AUDIT</span></div>
    </div>
  </div>
  <div class="header-line"></div>

  ${contentHtml}

  <div class="footer">
    <div>${escapeHtml(institutionName)} — Library Automation Report</div>
    <div>Confidential • Official Institutional Record</div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates and shares/downloads the Library PDF report using expo-print and expo-sharing.
 */
export async function generateLibraryPdfReport(options: GeneratePdfOptions): Promise<void> {
  const html = buildReportHtml(options);

  if (Platform.OS === 'web') {
    // Web platform print fallback
    await Print.printAsync({ html });
    return;
  }

  // Native PDF compilation via expo-print
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Download ${options.reportType} PDF Report`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    // Fallback if sharing is disabled on device
    await Print.printAsync({ uri });
  }
}
