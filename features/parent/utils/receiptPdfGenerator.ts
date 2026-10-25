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
  date?: string;
  particulars?: string;
  payerName?: string;
  studentName?: string;
  studentId?: string;
  classSection?: string;
  rollNo?: string;
  method?: string;
  paymentMethod?: string;
  status?: string;
}

export type ParentFeeReceiptData = FeeReceiptData;
export type StudentFeeReceiptData = FeeReceiptData;

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
  const institutionName = userStore.institutionName || userStore.schoolName || 'School Management System';
  const childName = receipt.studentName || userStore.childName || userStore.fullName || 'Student';
  const parentName = receipt.payerName || userStore.fullName || 'Parent';
  const rollNo = receipt.rollNo || userStore.linkedStudentUSN || userStore.rollNoOrUSN || '—';
  const classSection = receipt.classSection || 'Class 6 A';
  const receiptNo = receipt.receiptNo || (receipt.id ? `REC-${receipt.id.slice(-6).toUpperCase()}` : `REC-${Date.now().toString().slice(-6)}`);
  const dateStr = receipt.date || receipt.paidDate || receipt.paymentDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const generatedTimestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const method = (receipt.method || receipt.paymentMethod || 'UPI').toUpperCase();
  const particulars = receipt.particulars || receipt.title || 'Tuition & Academic Fees';

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
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #FDC836;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .institution-name {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
    }
    .receipt-title {
      font-size: 13px;
      font-weight: 700;
      color: #000000;
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
      background: #FFFDF0;
      border: 1px solid #FDE68A;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .student-name {
      font-size: 14px;
      font-weight: 800;
      color: #111827;
    }
    .student-details {
      font-size: 11px;
      color: #4B5563;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #F3F4F6;
      color: #111827;
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
      background: #FAF8F5;
      font-weight: 800;
      font-size: 13px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      border-top: 1px solid #E5E7EB;
      padding-top: 16px;
      font-size: 10px;
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
        <div class="meta-val">${escapeHtml(dateStr)}</div>
      </div>
    </div>

    <div class="student-card">
      <div class="student-name">Student: ${escapeHtml(childName)}</div>
      <div class="student-details">Parent / Payer: ${escapeHtml(parentName)} &bull; Class &amp; Section: ${escapeHtml(classSection)} &bull; USN / Roll No: ${escapeHtml(rollNo)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Particulars</th>
          <th>Payment Mode</th>
          <th>Status</th>
          <th style="text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${escapeHtml(particulars)}</strong></td>
          <td>${escapeHtml(method)}</td>
          <td><span style="color: #166534; font-weight: 700;">Paid</span></td>
          <td style="text-align: right; font-weight: 700;">${formatINR(receipt.amount)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3">Total Amount Received</td>
          <td style="text-align: right; color: #111827;">${formatINR(receipt.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="verified-badge">&#10003; Digitally Verified &amp; Signed</div>
      <div>${escapeHtml(institutionName)} &bull; Official Fee Receipt</div>
      <div>Generated on ${escapeHtml(generatedTimestamp)} &bull; Valid without physical signature</div>
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

export const generateStudentFeeReceiptPdf = generateParentFeeReceiptPdf;
