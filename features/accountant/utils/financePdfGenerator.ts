import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { IncomeRecord, ExpenseRecord } from '../types/finance';

export interface FeeReceiptInput {
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

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatINR(amount: number): string {
  return '₹' + Math.abs(amount).toLocaleString('en-IN');
}

/**
 * Generates and shares a PDF receipt for Accountant Fee Collection.
 */
export async function generateStudentFeeReceiptPdf(receipt: FeeReceiptInput): Promise<void> {
  const receiptNo = receipt.receiptNo || 'REC-' + Math.floor(100000 + Math.random() * 900000);
  const paymentDate = receipt.paymentDate || new Date().toISOString().slice(0, 10);
  const title = receipt.title || 'Student Fee Receipt';
  const payerName = receipt.payerName || 'Student / Parent';
  const classSection = receipt.classSection || 'General';
  const rollNo = receipt.rollNo || 'N/A';
  const paymentMethod = (receipt.paymentMethod || 'CASH').toUpperCase();
  const generatedDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student Fee Receipt - ${escapeHtml(receiptNo)}</title>
  <style>
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
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div class="institution-name">School ERP — Finance & Accounts</div>
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
      <div>School ERP System • Institutional Financial Module</div>
      <div>Confidential • ${escapeHtml(generatedDate)}</div>
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
      dialogTitle: `Download Fee Receipt - ${receiptNo}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

/**
 * Generates and shares a PDF for Accountant Financial Tally & Income/Expense Statement.
 */
export async function generateIncomeExpenseStatementPdf(data: StatementInput): Promise<void> {
  const { totalIncome, totalExpense, netTally, incomeRecords, expenseRecords } = data;
  const generatedDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Income & Expense Statement</title>
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
      <div class="brand">School ERP — Accountant Module</div>
      <div class="title">Income & Expense Tally Statement</div>
    </div>
    <div class="meta">
      <div>Academic Term Financial Summary</div>
      <div>Generated: <strong>${escapeHtml(generatedDate)}</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card" style="background: #F0FDF4; border-color: #BBF7D0;">
      <div class="kpi-label" style="color: #166534;">Total Income Collections</div>
      <div class="kpi-val" style="color: #14532D;">${formatINR(totalIncome)}</div>
    </div>
    <div class="kpi-card" style="background: #FEF2F2; border-color: #FECACA;">
      <div class="kpi-label" style="color: #991B1B;">Total Expenditure</div>
      <div class="kpi-val" style="color: #7F1D1D;">${formatINR(totalExpense)}</div>
    </div>
    <div class="kpi-card" style="background: ${netTally >= 0 ? '#EFF6FF' : '#FEF2F2'}; border-color: ${netTally >= 0 ? '#BFDBFE' : '#FECACA'};">
      <div class="kpi-label" style="color: ${netTally >= 0 ? '#1E40AF' : '#991B1B'};">Net Balance Surplus / (Deficit)</div>
      <div class="kpi-val" style="color: ${netTally >= 0 ? '#1E3A8A' : '#7F1D1D'};">${netTally < 0 ? '-' : ''}${formatINR(netTally)}</div>
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
          ? `<tr><td colspan="6" style="text-align: center; color: #6B7280; padding: 12px;">No income records registered for this period.</td></tr>`
          : incomeRecords
              .map(
                (inc, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(inc.paymentDate)}</td>
            <td><strong>${escapeHtml(inc.title)}</strong><br/><small>${escapeHtml(inc.payerName)}</small></td>
            <td>${escapeHtml(inc.category.replace('_', ' ').toUpperCase())}</td>
            <td>${escapeHtml((inc.paymentMethod || 'CASH').toUpperCase())}</td>
            <td style="text-align: right; font-weight: 700; color: #059669;">${formatINR(inc.amount)}</td>
          </tr>
        `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 20px;">Expenses & Disbursements Summary (${expenseRecords.length} Records)</div>
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
          ? `<tr><td colspan="6" style="text-align: center; color: #6B7280; padding: 12px;">No expense records registered for this period.</td></tr>`
          : expenseRecords
              .map(
                (exp, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(exp.paymentDate)}</td>
            <td><strong>${escapeHtml(exp.title)}</strong><br/><small>${escapeHtml(exp.payeeName || 'N/A')}</small></td>
            <td>${escapeHtml(exp.category.replace('_', ' ').toUpperCase())}</td>
            <td>${escapeHtml((exp.paymentMethod || 'BANK').toUpperCase())}</td>
            <td style="text-align: right; font-weight: 700; color: #DC2626;">${formatINR(exp.amount)}</td>
          </tr>
        `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="footer">
    <div>School ERP System • Financial Ledger Statement</div>
    <div>Confidential — For Internal Financial Audit Use Only</div>
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
      dialogTitle: 'Download Financial Tally Statement',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

