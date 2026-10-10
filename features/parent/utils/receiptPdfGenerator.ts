import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { useUserStore } from '../../../store/useUserStore';

export interface FeeReceiptData {
  id?: string;
  title?: string;
  amount: number;
  receiptNo?: string;
  paidDate?: string;
  paymentDate?: string;
  payerName?: string;
  studentId?: string;
  classSection?: string;
  rollNo?: string;
  paymentMethod?: string;
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
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toLocaleString('en-IN');
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export async function generateParentFeeReceiptPdf(receipt: FeeReceiptData): Promise<void> {
  const userStore = useUserStore.getState();
  const institutionName = userStore.institutionName || userStore.schoolName || '—';

  // B4: Stable receipt number determination
  let receiptNo = receipt.receiptNo;
  if (!receiptNo && receipt.id) {
    receiptNo = `REC-${receipt.id.slice(-6).toUpperCase()}`;
  } else if (!receiptNo) {
    receiptNo = '—';
  }

  const paidDate = receipt.paidDate || receipt.paymentDate || '—';
  const title = receipt.title || 'Tuition & Academic Fees';

  // B3: Real information or fallback to '—' (no fake names/classes)
  const payerName = receipt.payerName || '—';
  const classSection = receipt.classSection || '—';
  const rollNo = receipt.rollNo || '—';
  const paymentMethod = (receipt.paymentMethod || 'UPI').toUpperCase();
  const generatedDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt - ${escapeHtml(receiptNo)}</title>
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
      border-bottom: 2px solid #F4C430;
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
      color: #D97706;
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
    .meta-item {
      font-size: 11px;
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
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .student-name {
      font-size: 14px;
      font-weight: 800;
      color: #92400E;
    }
    .student-details {
      font-size: 11px;
      color: #B45309;
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
      <div class="institution-name">${escapeHtml(institutionName)}</div>
      <div class="receipt-title">Official Fee Payment Receipt</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Receipt Number</div>
        <div class="meta-val">${escapeHtml(receiptNo)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Payment Date</div>
        <div class="meta-val">${escapeHtml(paidDate)}</div>
      </div>
    </div>

    <div class="student-card">
      <div class="student-name">Student: ${escapeHtml(payerName)}</div>
      <div class="student-details">Class & Section: ${escapeHtml(classSection)} • Roll No: ${escapeHtml(rollNo)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description / Category</th>
          <th>Payment Mode</th>
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
          <td colspan="2">Total Amount Received</td>
          <td style="text-align: right;">${formatINR(receipt.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="verified-badge">✓ Digitally Verified by Accounts Dept.</div>
      <div>${escapeHtml(institutionName)} • Official Electronic Receipt</div>
      <div>Confidential — For Authorized Parent / Student Record Only • ${escapeHtml(generatedDate)}</div>
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

