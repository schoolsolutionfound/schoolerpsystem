import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Book, BookCopy, Loan, Fine, StudentProfile } from '../types';

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
 * Builds standard Indian-Rupee or numeric currency string.
 */
function formatCurrency(amount: number): string {
  return '₹' + Math.abs(amount).toFixed(2);
}

/**
 * Builds the complete HTML string for the PDF report.
 */
function buildReportHtml(options: GeneratePdfOptions): string {
  const { reportType, timeRange, books, copies, loans, fines, students } = options;

  // Key KPI metrics
  const totalBooksCount = books.length;
  const totalCopiesCount = copies.length;
  const availableCopiesCount = copies.filter((c) => c.status === 'AVAILABLE').length;
  const issuedCopiesCount = copies.filter((c) => c.status === 'ISSUED').length;
  const overdueCopiesCount = copies.filter((c) => c.status === 'OVERDUE').length;
  const damagedCopiesCount = copies.filter((c) => c.status === 'DAMAGED' || c.status === 'UNDER_REPAIR').length;

  const activeLoansCount = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
  const overdueLoansCount = loans.filter((l) => l.status === 'OVERDUE').length;

  const totalFinesCollected = fines.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  const totalFinesOutstanding = fines
    .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
    .reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);

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

  // Filter dataset for specialized reports
  const isOverdueReport = reportType.toLowerCase().includes('overdue');
  const isFinancialReport = reportType.toLowerCase().includes('fine') || reportType.toLowerCase().includes('financial');
  const isInventoryReport = reportType.toLowerCase().includes('inventory');

  // Render Table Rows
  let tableSectionHtml = '';

  if (isOverdueReport) {
    const overdueLoans = loans.filter((l) => l.status === 'OVERDUE' || (l.status === 'ACTIVE' && new Date(l.dueDate) < new Date()));
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
                        <td>${loan.issueDate || loan.issuedAt ? new Date(loan.issueDate || loan.issuedAt!).toLocaleDateString() : 'N/A'}</td>
                        <td style="color: #DC2626; font-weight: 700;">${new Date(loan.dueDate).toLocaleDateString()}</td>
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
      <div class="section-title">Fine Receipts & Outstanding Ledger (${fines.length} Transactions)</div>
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
            fines.length === 0
              ? `<tr><td colspan="7" class="empty-cell">No fine records registered for the selected period.</td></tr>`
              : fines
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
    // Executive Overview (Multi-section)
    tableSectionHtml = `
      <div class="section-title">Active Loans & Circulation Summary (${loans.slice(0, 15).length} Recent)</div>
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
            loans.length === 0
              ? `<tr><td colspan="6" class="empty-cell">No circulation records available.</td></tr>`
              : loans
                  .slice(0, 15)
                  .map((loan, idx) => {
                    const student = students.find((s) => s.id === loan.studentId);
                    const book = books.find((b) => b.id === loan.bookId);
                    const badgeClass = loan.status === 'OVERDUE' ? 'badge-overdue' : 'badge-issued';
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${escapeHtml(student?.fullName || 'Unknown Student')}</strong></td>
                        <td>${escapeHtml(book?.title || 'Unknown Title')}</td>
                        <td>${loan.issueDate || loan.issuedAt ? new Date(loan.issueDate || loan.issuedAt!).toLocaleDateString() : 'N/A'}</td>
                        <td>${new Date(loan.dueDate).toLocaleDateString()}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(loan.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>

      <div class="section-title" style="margin-top: 24px;">Financial Fine Dues Summary</div>
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
            fines.length === 0
              ? `<tr><td colspan="7" class="empty-cell">No financial dues recorded.</td></tr>`
              : fines
                  .slice(0, 15)
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
                        <td><span class="badge ${badgeClass}">${fine.status}</span></td>
                      </tr>
                    `;
                  })
                  .join('')
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
  <title>${reportType}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background-color: #FFFFFF;
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
    .brand {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.3px;
    }
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
    .meta-box strong {
      color: #111827;
    }
    .kpi-grid {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-bottom: 16px;
      width: 100%;
    }
    .kpi-card {
      flex: 1;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 10px 8px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #4B5563;
    }
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
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 4px solid #10B981;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10px;
    }
    th {
      background-color: #F3F4F6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #E5E7EB;
      text-transform: uppercase;
      font-size: 8px;
      letter-spacing: 0.4px;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #E5E7EB;
      color: #1F2937;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    tr:nth-child(even) {
      background-color: #FAFAFA;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
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
    .footer {
      margin-top: 24px;
      border-top: 1px solid #E5E7EB;
      padding-top: 10px;
      font-size: 9px;
      color: #9CA3AF;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">School ERP — Library Management System</div>
      <div class="report-title">${reportType}</div>
    </div>
    <div class="meta-box">
      <div>Reporting Period: <strong>${periodLabel}</strong></div>
      <div>Generated Date: <strong>${generatedDate}</strong></div>
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
    <div>School ERP System • Library Management Module</div>
    <div>Confidential — For Authorized Institutional Use Only</div>
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
