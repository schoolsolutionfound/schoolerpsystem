import { IncomeRecord, ExpenseRecord } from '../types/finance';
import {
  escapeHtml,
  formatINR,
  getInstitutionName,
  formatGeneratedDate,
  buildHtmlDocument,
  sharePdf,
} from '../../shared/utils/pdf/pdfShared';

export interface FeeReceiptInput {
  id?: string;
  title?: string;
  amount: number;
  receiptNo?: string;
  paymentDate?: string;
  payerName?: string;
  studentId?: string;
  classSection?: string;
  rollNo?: string;
  paymentMethod?: string;
}

export interface StatementInput {
  totalIncome: number;
  totalExpense: number;
  netTally: number;
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];
}

/**
 * Generates and shares a PDF receipt for Accountant Fee Collection.
 */
export async function generateStudentFeeReceiptPdf(receipt: FeeReceiptInput): Promise<void> {
  const institutionName = getInstitutionName();

  // B4: Stable receipt number (no Math.random or Date.now)
  let receiptNo = receipt.receiptNo;
  if (!receiptNo && receipt.id) {
    receiptNo = `REC-${receipt.id.slice(-6).toUpperCase()}`;
  } else if (!receiptNo) {
    receiptNo = '—';
  }

  const paymentDate = receipt.paymentDate || '—';
  const title = receipt.title || 'Student Fee Receipt';

  // B3: Real information or fallback to '—' (no fake names/classes)
  const payerName = receipt.payerName || '—';
  const classSection = receipt.classSection || '—';
  const rollNo = receipt.rollNo || '—';
  const paymentMethod = (receipt.paymentMethod || 'CASH').toUpperCase();
  const generatedDate = formatGeneratedDate();

  // Receipt-specific stylesheet (card layout differs from table reports).
  const receiptCss = `
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    .receipt-box {
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #10B981;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .institution-name {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
    }
    .receipt-title {
      font-size: 14px;
      font-weight: 700;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #F9FAFB;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .meta-label {
      color: #6B7280;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
    }
    .meta-val {
      font-weight: 700;
      color: #111827;
      font-size: 12px;
      margin-top: 2px;
    }
    .student-card {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .student-name {
      font-size: 14px;
      font-weight: 800;
      color: #065F46;
    }
    .student-details {
      font-size: 11px;
      color: #047857;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #F3F4F6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid #E5E7EB;
      font-size: 10px;
      text-transform: uppercase;
    }
    td {
      padding: 12px 10px;
      border-bottom: 1px solid #E5E7EB;
      font-size: 12px;
      word-break: break-word;
    }
    .total-row {
      background: #ECFDF5;
      font-weight: 800;
    }
    .total-row td {
      color: #065F46;
      font-size: 14px;
      border-top: 2px solid #A7F3D0;
      border-bottom: 2px solid #A7F3D0;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      font-size: 10px;
      color: #9CA3AF;
    }
    .verified-badge {
      display: inline-block;
      color: #059669;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 6px;
    }
  `;

  const html = buildHtmlDocument({
    title: `Student Fee Receipt - ${receiptNo}`,
    css: receiptCss,
    content: `
  <div class="receipt-box">
    <div class="header">
      <div class="institution-name">${escapeHtml(institutionName)}</div>
      <div class="receipt-title">Official Fee Payment Voucher</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Receipt Voucher No</div>
        <div class="meta-val">${escapeHtml(receiptNo)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date Processed</div>
        <div class="meta-val">${escapeHtml(paymentDate)}</div>
      </div>
    </div>

    <div class="student-card">
      <div class="student-name">Payer / Student: ${escapeHtml(payerName)}</div>
      <div class="student-details">Class Section: ${escapeHtml(classSection)} • Roll / ID: ${escapeHtml(rollNo)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Particulars / Fee Head</th>
          <th>Mode</th>
          <th style="text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${escapeHtml(title)}</strong></td>
          <td>${escapeHtml(paymentMethod)}</td>
          <td style="text-align: right; font-weight: 700;">${formatINR(receipt.amount)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Total Payment Received</td>
          <td style="text-align: right;">${formatINR(receipt.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="verified-badge">✓ Verified & Audited by Accounts Department</div>
      <div>${escapeHtml(institutionName)} • Institutional Financial Module</div>
      <div>Confidential • ${escapeHtml(generatedDate)}</div>
    </div>
  </div>
    `,
  });

  await sharePdf(html, `Download Fee Receipt - ${receiptNo}`);
}

/**
 * Generates and shares a PDF for Accountant Financial Tally & Income/Expense Statement.
 */
export async function generateIncomeExpenseStatementPdf(data: StatementInput): Promise<void> {
  const institutionName = getInstitutionName();

  const { incomeRecords = [], expenseRecords = [] } = data;

  // B8: Ensure summary totals use the SAME record set as displayed in the tables
  const totalIncome = incomeRecords.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  const totalExpense = expenseRecords.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const netTally = totalIncome - totalExpense;

  const generatedDate = formatGeneratedDate();

  const auditCss = `
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    .statement-box {
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      padding: 22px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #FDC836;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .institution-name {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
    }
    .statement-title {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      background: #FDC836;
      display: inline-block;
      padding: 4px 14px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #F9FAFB;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .meta-label {
      color: #6B7280;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
    }
    .meta-val {
      font-weight: 700;
      color: #111827;
      font-size: 11px;
      margin-top: 2px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .summary-card {
      background: #FFFDF0;
      border: 1px solid #FDE68A;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .summary-card.expense {
      background: #FAF8F5;
      border-color: #E5E7EB;
    }
    .summary-card.net {
      background: #1A1B1C;
      border-color: #1A1B1C;
    }
    .summary-label {
      font-size: 8px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .summary-val {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin-top: 4px;
    }
    .summary-card.net .summary-label,
    .summary-card.net .summary-val {
      color: #F4C430;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 4px solid #FDC836;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #F3F4F6;
      color: #111827;
      font-weight: 700;
      text-align: left;
      padding: 8px;
      border-bottom: 2px solid #E5E7EB;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #E5E7EB;
      font-size: 10px;
      word-break: break-word;
    }
    tbody tr:nth-child(even) td {
      background: #FAFAFA;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sub {
      color: #6B7280;
      font-size: 9px;
    }
    .amount-income {
      color: #166534;
      font-weight: 800;
    }
    .amount-expense {
      color: #B91C1C;
      font-weight: 800;
    }
    .empty-row {
      text-align: center;
      color: #6B7280;
      padding: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 18px;
      border-top: 1px solid #E5E7EB;
      padding-top: 14px;
      font-size: 9px;
      color: #6B7280;
      line-height: 1.6;
    }
    .verified-badge {
      display: inline-block;
      background: #DCFCE7;
      color: #166534;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }
  `;

  const html = buildHtmlDocument({
    title: 'Income & Expense Audit Statement',
    css: auditCss,
    content: `
  <div class="statement-box">
    <div class="header">
      <div class="institution-name">${escapeHtml(institutionName)}</div>
      <div class="statement-title">Income &amp; Expense Audit Statement</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Audit Scope</div>
        <div class="meta-val">All displayed income &amp; expense records</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Generated On</div>
        <div class="meta-val">${escapeHtml(generatedDate)}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Income</div>
        <div class="summary-val">${formatINR(totalIncome)}</div>
      </div>
      <div class="summary-card expense">
        <div class="summary-label">Total Expenditure</div>
        <div class="summary-val">${formatINR(totalExpense)}</div>
      </div>
      <div class="summary-card net">
        <div class="summary-label">Net Balance</div>
        <div class="summary-val">${formatINR(netTally)}</div>
      </div>
    </div>

    <div class="section-title">Income Collections Summary (${incomeRecords.length} Records)</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Particulars / Title</th>
          <th>Category</th>
          <th>Payment Mode</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${
          incomeRecords.length === 0
            ? `<tr><td colspan="6" class="empty-row">No income records registered for this period.</td></tr>`
            : incomeRecords
                .map(
                  (inc, idx) => {
                    // B10: Safe null / undefined category check
                    const categoryDisplay = inc.category
                      ? String(inc.category).replace(/_/g, ' ').toUpperCase()
                      : '—';
                    const dateDisplay = inc.paymentDate || inc.dueDate || '—';
                    const titleDisplay = inc.title || 'Income Record';
                    const payerDisplay = inc.payerName || '—';

                    return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(dateDisplay)}</td>
            <td><strong>${escapeHtml(titleDisplay)}</strong><br/><small class="sub">${escapeHtml(payerDisplay)}</small></td>
            <td>${escapeHtml(categoryDisplay)}</td>
            <td>${escapeHtml((inc.paymentMethod || 'CASH').toUpperCase())}</td>
            <td style="text-align: right;" class="amount-income">${formatINR(inc.amount)}</td>
          </tr>
        `;
                  }
                )
                .join('')
        }
      </tbody>
    </table>

    <div class="section-title">Expenses &amp; Disbursements Summary (${expenseRecords.length} Records)</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Title / Vendor</th>
          <th>Category</th>
          <th>Mode</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${
          expenseRecords.length === 0
            ? `<tr><td colspan="6" class="empty-row">No expense records registered for this period.</td></tr>`
            : expenseRecords
                .map(
                  (exp, idx) => {
                    // B10: Safe null / undefined category check
                    const categoryDisplay = exp.category
                      ? String(exp.category).replace(/_/g, ' ').toUpperCase()
                      : '—';
                    const dateDisplay = exp.paymentDate || exp.dueDate || '—';
                    const titleDisplay = exp.title || 'Expense Record';
                    const payeeDisplay = exp.payeeName || 'N/A';

                    return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(dateDisplay)}</td>
            <td><strong>${escapeHtml(titleDisplay)}</strong><br/><small class="sub">${escapeHtml(payeeDisplay)}</small></td>
            <td>${escapeHtml(categoryDisplay)}</td>
            <td>${escapeHtml((exp.paymentMethod || 'BANK').toUpperCase())}</td>
            <td style="text-align: right;" class="amount-expense">${formatINR(exp.amount)}</td>
          </tr>
        `;
                  }
                )
                .join('')
        }
      </tbody>
    </table>

    <div class="footer">
      <div class="verified-badge">&#10003; Digitally Verified &amp; Audited</div>
      <div>${escapeHtml(institutionName)} &bull; Official Income &amp; Expense Statement</div>
      <div>Generated on ${escapeHtml(generatedDate)} &bull; For internal financial audit use</div>
    </div>
  </div>
    `,
  });

  await sharePdf(html, 'Download Audit Statement');
}

