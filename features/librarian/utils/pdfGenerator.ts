import { Book, BookCopy, Loan, Fine, StudentProfile } from '../types';
import {
  escapeHtml,
  formatCurrency,
  getInstitutionName,
  formatGeneratedDate,
  baseReportCss,
  buildHtmlDocument,
  sharePdf,
} from '../../shared/utils/pdf/pdfShared';

export interface GeneratePdfOptions {
  reportType: string;
  timeRange: 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  students: StudentProfile[];
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

/**
 * Builds the complete HTML string for the PDF report.
 */
function buildReportHtml(options: GeneratePdfOptions): string {
  const institutionName = getInstitutionName();

  const { reportType, timeRange, books, copies, students } = options;

  // B5: Filter loans and fines to match the requested time range
  const filteredLoans = options.loans.filter((l) => isWithinTimeRange(l.issueDate || l.issuedAt || l.createdAt, timeRange));
  const filteredFines = options.fines.filter((f) => isWithinTimeRange(f.createdAt, timeRange));

  // Key KPI metrics
  const totalBooksCount = books.length;
  const totalCopiesCount = copies.length;

  // B6: Active loans must only be ACTIVE or OVERDUE (excluding RETURNED, LOST, CANCELLED)
  const activeLoansList = filteredLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  const activeLoansCount = activeLoansList.length;
  const overdueLoansCount = filteredLoans.filter((l) => l.status === 'OVERDUE').length;

  const totalFinesCollected = filteredFines.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  const totalFinesOutstanding = filteredFines
    .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
    .reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);

  const periodLabelMap: Record<string, string> = {
    MONTH: 'This Month',
    QUARTER: 'This Quarter',
    YEAR: 'Academic Year',
    ALL: 'All Time',
  };
  const periodLabel = periodLabelMap[timeRange] || timeRange;
  const generatedDate = formatGeneratedDate();

  // Filter dataset for specialized reports
  const isOverdueReport = reportType.toLowerCase().includes('overdue');
  const isFinancialReport = reportType.toLowerCase().includes('fine') || reportType.toLowerCase().includes('financial');
  const isInventoryReport = reportType.toLowerCase().includes('inventory');

  // Render Table Rows
  let tableSectionHtml = '';

  if (isOverdueReport) {
    // Audit list uses ALL overdue loans regardless of the report period filter (N4):
  // an audit must never hide older overdue records just because they predate the window.
  const overdueLoans = options.loans.filter((l) => l.status === 'OVERDUE' || (l.status === 'ACTIVE' && new Date(l.dueDate) < new Date()));
    tableSectionHtml = `
      <div class="section-title">Overdue Loans Audit List (${overdueLoans.length} Records)</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Member Name</th>
            <th>Book Title</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            overdueLoans.length === 0
              ? `<tr><td colspan="6" class="empty-cell">No overdue loans found for the selected period.</td></tr>`
              : overdueLoans
                  .map((loan, idx) => {
                    const student = students.find((s) => s.id === loan.studentId);
                    const book = books.find((b) => b.id === loan.bookId);
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong><br/><small>${escapeHtml(student?.admissionNo || 'N/A')}</small></td>
                        <td>${escapeHtml(book?.title || 'Unknown Title')}</td>
                        <td>${loan.issueDate || loan.issuedAt ? escapeHtml(new Date(loan.issueDate || loan.issuedAt!).toLocaleDateString()) : 'N/A'}</td>
                        <td style="color: #DC2626; font-weight: 700;">${escapeHtml(new Date(loan.dueDate).toLocaleDateString())}</td>
                        <td><span class="badge badge-overdue">OVERDUE</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    `;
  } else if (isFinancialReport) {
    tableSectionHtml = `
      <div class="section-title">Fine Receipts & Outstanding Ledger (${filteredFines.length} Transactions)</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Member Name</th>
            <th>Reason / Type</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Outstanding</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            filteredFines.length === 0
              ? `<tr><td colspan="7" class="empty-cell">No fine records registered for the selected period.</td></tr>`
              : filteredFines
                  .map((fine, idx) => {
                    const student = students.find((s) => s.id === fine.studentId);
                    const outstanding = fine.amount - (fine.paidAmount || 0);
                    const badgeClass = fine.status === 'PAID' ? 'badge-paid' : fine.status === 'WAIVED' ? 'badge-available' : 'badge-unpaid';
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong><br/><small>${escapeHtml(student?.admissionNo || 'N/A')}</small></td>
                        <td>${escapeHtml(fine.fineType || fine.reason || 'Library Fine')}</td>
                        <td>${formatCurrency(fine.amount)}</td>
                        <td style="color: #059669; font-weight: 700;">${formatCurrency(fine.paidAmount || 0)}</td>
                        <td style="color: #DC2626; font-weight: 700;">${formatCurrency(outstanding > 0 ? outstanding : 0)}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(fine.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    `;
  } else if (isInventoryReport) {
    tableSectionHtml = `
      <div class="section-title">Physical Inventory Audit Log (${copies.length} Physical Copies)</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Accession No</th>
            <th>Book Title</th>
            <th>Subject</th>
            <th>Shelf Location</th>
            <th>Condition</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            copies.length === 0
              ? `<tr><td colspan="7" class="empty-cell">No physical copy records available in inventory.</td></tr>`
              : copies
                  .map((copy, idx) => {
                    const book = books.find((b) => b.id === copy.bookId);
                    const badgeClass =
                      copy.status === 'AVAILABLE'
                        ? 'badge-available'
                        : copy.status === 'ISSUED'
                        ? 'badge-issued'
                        : copy.status === 'OVERDUE'
                        ? 'badge-overdue'
                        : 'badge-damaged';
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${escapeHtml(copy.accessionNumber)}</strong></td>
                        <td>${escapeHtml(book?.title || 'Unknown Title')}</td>
                        <td>${escapeHtml(book?.subject || 'General')}</td>
                        <td>${escapeHtml(copy.rack || copy.shelf || book?.shelfLocation || 'Main Storage')}</td>
                        <td>${escapeHtml(copy.condition)}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(copy.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    `;
  } else {
    // Executive Overview — B6: Display strictly active loans and indicate truncation clearly
    const displayedActiveLoans = activeLoansList.slice(0, 15);
    const displayedFines = filteredFines.slice(0, 15);

    tableSectionHtml = `
      <div class="section-title">Active Loans & Circulation Summary (${
        activeLoansList.length > 15
          ? `Showing 15 of ${activeLoansList.length} Active Loans`
          : `${activeLoansList.length} Active Loans`
      })</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Member Name</th>
            <th>Book Title</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            displayedActiveLoans.length === 0
              ? `<tr><td colspan="6" class="empty-cell">No active circulation records available.</td></tr>`
              : displayedActiveLoans
                  .map((loan, idx) => {
                    const student = students.find((s) => s.id === loan.studentId);
                    const book = books.find((b) => b.id === loan.bookId);
                    const badgeClass = loan.status === 'OVERDUE' ? 'badge-overdue' : 'badge-issued';
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong></td>
                        <td>${escapeHtml(book?.title || 'Unknown Title')}</td>
                        <td>${loan.issueDate || loan.issuedAt ? escapeHtml(new Date(loan.issueDate || loan.issuedAt!).toLocaleDateString()) : 'N/A'}</td>
                        <td>${escapeHtml(new Date(loan.dueDate).toLocaleDateString())}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(loan.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>

      <div class="section-title" style="margin-top: 24px;">Financial Fine Dues Summary (${
        filteredFines.length > 15
          ? `Showing 15 of ${filteredFines.length} Records`
          : `${filteredFines.length} Records`
      })</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Member Name</th>
            <th>Type</th>
            <th>Total Amount</th>
            <th>Paid</th>
            <th>Outstanding</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            displayedFines.length === 0
              ? `<tr><td colspan="7" class="empty-cell">No financial dues recorded.</td></tr>`
              : displayedFines
                  .map((fine, idx) => {
                    const student = students.find((s) => s.id === fine.studentId);
                    const outstanding = fine.amount - (fine.paidAmount || 0);
                    const badgeClass = fine.status === 'PAID' ? 'badge-paid' : 'badge-unpaid';
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong></td>
                        <td>${escapeHtml(fine.fineType || 'Fine')}</td>
                        <td>${formatCurrency(fine.amount)}</td>
                        <td style="color: #059669; font-weight: 700;">${formatCurrency(fine.paidAmount || 0)}</td>
                        <td style="color: #DC2626; font-weight: 700;">${formatCurrency(outstanding > 0 ? outstanding : 0)}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(fine.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    `;
  }

  // Report-specific classes on top of the shared base stylesheet.
  const libraryExtraCss = `
    .brand { letter-spacing: -0.3px; }
    .report-title {
      font-size: 14px;
      font-weight: 700;
      color: #059669;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #4B5563;
    }
    .meta-box strong { color: #111827; }
    .kpi-value {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin-top: 4px;
    }
    .kpi-sub {
      font-size: 8px;
      color: #6B7280;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-available { background-color: #D1FAE5; color: #065F46; }
    .badge-issued { background-color: #DBEAFE; color: #1E40AF; }
    .badge-overdue { background-color: #FEE2E2; color: #991B1B; }
    .badge-damaged { background-color: #FEF3C7; color: #92400E; }
    .badge-paid { background-color: #D1FAE5; color: #065F46; }
    .badge-unpaid { background-color: #FEE2E2; color: #991B1B; }
    .empty-cell {
      text-align: center;
      color: #6B7280;
      font-style: italic;
      padding: 14px;
    }
  `;

  return buildHtmlDocument({
    title: reportType,
    css: baseReportCss('#10B981') + libraryExtraCss,
    content: `
  <div class="header">
    <div>
      <div class="brand">${escapeHtml(institutionName)} — Library Management System</div>
      <div class="report-title">${escapeHtml(reportType)}</div>
    </div>
    <div class="meta-box">
      <div>Reporting Period: <strong>${escapeHtml(periodLabel)}</strong></div>
      <div>Generated Date: <strong>${escapeHtml(generatedDate)}</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card" style="background: #EFF6FF; border-color: #BFDBFE;">
      <div class="kpi-label" style="color: #1E40AF;">Total Copies</div>
      <div class="kpi-value" style="color: #1E3A8A;">${totalCopiesCount}</div>
      <div class="kpi-sub">${totalBooksCount} Unique Titles</div>
    </div>
    <div class="kpi-card" style="background: #FEF3C7; border-color: #FDE68A;">
      <div class="kpi-label" style="color: #B45309;">Active Loans</div>
      <div class="kpi-value" style="color: #78350F;">${activeLoansCount}</div>
      <div class="kpi-sub">${overdueLoansCount} Overdue</div>
    </div>
    <div class="kpi-card" style="background: #F0FDF4; border-color: #BBF7D0;">
      <div class="kpi-label" style="color: #166534;">Collected Fines</div>
      <div class="kpi-value" style="color: #14532D;">${formatCurrency(totalFinesCollected)}</div>
      <div class="kpi-sub">Total Revenue Logged</div>
    </div>
    <div class="kpi-card" style="background: #FEF2F2; border-color: #FECACA;">
      <div class="kpi-label" style="color: #991B1B;">Outstanding Fines</div>
      <div class="kpi-value" style="color: #7F1D1D;">${formatCurrency(totalFinesOutstanding)}</div>
      <div class="kpi-sub">Pending Dues</div>
    </div>
  </div>

  ${tableSectionHtml}

  <div class="footer">
    <div>${escapeHtml(institutionName)} • Library Management Module</div>
    <div>Confidential — For Authorized Institutional Use Only</div>
  </div>
    `,
  });
}

/**
 * Generates and shares/downloads the Library PDF report using expo-print and expo-sharing.
 */
export async function generateLibraryPdfReport(options: GeneratePdfOptions): Promise<void> {
  const html = buildReportHtml(options);
  await sharePdf(html, `Download ${options.reportType} PDF Report`);
}
