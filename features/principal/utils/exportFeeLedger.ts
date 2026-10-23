import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { StudentFeeRecord } from '../types/principal.types';

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function generateFeeCsvString(
  type: 'dues' | 'collected',
  records: StudentFeeRecord[],
  institutionName: string = 'KIVQUO Institute of Technology'
): string {
  const isDues = type === 'dues';
  const title = isDues ? 'Fee Dues (Outstanding Balances) Report' : 'Fee Collection Audit Report';
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const totalAmount = records.reduce((sum, r) => sum + (isDues ? r.dueAmount : r.paidAmount), 0);

  const metaRows = [
    `"INSTITUTION","${institutionName.replace(/"/g, '""')}"`,
    `"REPORT TYPE","${title}"`,
    `"GENERATED AT","${generatedAt}"`,
    `"RECORD COUNT","${records.length}"`,
    `"TOTAL ${isDues ? 'OUTSTANDING' : 'COLLECTED'} (INR)","${totalAmount}"`,
    '',
    [
      'Sl No',
      'Roll No / USN',
      'Student Name',
      'Department',
      'Year',
      'Class Name',
      'Total Fee (INR)',
      'Paid Amount (INR)',
      'Due Amount (INR)',
      'Status',
      'Due Date',
      'Contact Phone',
    ]
      .map((h) => `"${h}"`)
      .join(','),
  ];

  const dataRows = records.map((r, idx) => {
    return [
      idx + 1,
      escapeCsvField(r.rollNumber),
      escapeCsvField(r.studentName),
      escapeCsvField(r.department),
      escapeCsvField(r.year),
      escapeCsvField(r.className || `${r.department} ${r.year}`),
      r.totalFee,
      r.paidAmount,
      r.dueAmount,
      escapeCsvField(
        r.dueAmount === 0
          ? 'Fully Paid'
          : r.paidAmount > 0
          ? 'Partially Paid'
          : 'Overdue / Unpaid'
      ),
      escapeCsvField(r.dueDate),
      escapeCsvField(r.contactPhone || 'N/A'),
    ].join(',');
  });

  return metaRows.join('\n') + '\n' + dataRows.join('\n');
}

export async function exportFeeListCSV(
  type: 'dues' | 'collected',
  records: StudentFeeRecord[],
  institutionName: string = 'KIVQUO Institute of Technology'
): Promise<void> {
  try {
    if (!records || records.length === 0) {
      Alert.alert('No Records', 'No fee records found to export.');
      return;
    }

    const csvContent = generateFeeCsvString(type, records, institutionName);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Fee_${type === 'dues' ? 'Outstanding_Dues' : 'Collection_Audit'}_${timestamp}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
      const fileUri = `${dir}${filename}`;
      await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, {
        encoding: (FileSystem as any).EncodingType?.UTF8 || 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${type === 'dues' ? 'Outstanding Fee Dues' : 'Collected Fees'} CSV`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Saved', `CSV file successfully generated at ${fileUri}`);
      }
    }
  } catch (err: any) {
    console.error('[exportFeeListCSV error]:', err);
    Alert.alert('Export Error', err?.message || 'Could not export CSV file.');
  }
}

export function buildFeeReportHtml(
  type: 'dues' | 'collected',
  records: StudentFeeRecord[],
  institutionName: string = 'KIVQUO Institute of Technology'
): string {
  const isDues = type === 'dues';
  const reportTitle = isDues
    ? 'Institutional Outstanding Dues Ledger'
    : 'Institutional Fee Collection Ledger';
  const themeColor = isDues ? '#D97706' : '#111827';
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const totalAmount = records.reduce(
    (sum, r) => sum + (isDues ? r.dueAmount : r.paidAmount),
    0
  );

  const rowsHtml = records
    .map(
      (r, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 11px;">${i + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-weight: 700; font-size: 11px;">${r.rollNumber}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 12px; font-weight: 600;">${r.studentName}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 11px; color: #4B5563;">${r.department} · ${r.year}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 11px; text-align: right;">₹${r.totalFee.toLocaleString('en-IN')}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 11px; text-align: right; color: #111827; font-weight: 600;">₹${r.paidAmount.toLocaleString('en-IN')}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 11px; text-align: right; color: #D97706; font-weight: 700;">₹${r.dueAmount.toLocaleString('en-IN')}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 10px;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 700; background-color: ${
            r.dueAmount === 0
              ? '#DCFCE7; color: #166534;'
              : r.paidAmount > 0
              ? '#FEF3C7; color: #B45309;'
              : '#FEE2E2; color: #991B1B;'
          }">
            ${r.dueAmount === 0 ? 'PAID' : r.paidAmount > 0 ? 'PARTIAL' : 'OVERDUE'}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${reportTitle}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 0; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${themeColor}; padding-bottom: 14px; margin-bottom: 16px; }
        .title { font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px 0; }
        .inst { font-size: 12px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .meta-box { text-align: right; font-size: 11px; color: #4B5563; }
        .summary-bar { display: flex; gap: 20px; background: #F3F4F6; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; }
        .summary-item { font-size: 12px; }
        .summary-val { font-size: 15px; font-weight: 800; color: #111827; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #111827; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 8px 10px; }
        .footer { margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #9CA3AF; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="inst">${institutionName}</div>
          <h1 class="title">${reportTitle}</h1>
          <div style="font-size: 12px; color: #4B5563; margin-top: 2px;">
            ${isDues ? 'Students with outstanding institutional balance' : 'Institutional fee receipts & partial collections'}
          </div>
        </div>
        <div class="meta-box">
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Total Records:</strong> ${records.length}</div>
        </div>
      </div>

      <div class="summary-bar">
        <div class="summary-item">
          <div style="color: #6B7280; font-size: 10px; font-weight: 700; text-transform: uppercase;">Students Listed</div>
          <div class="summary-val">${records.length}</div>
        </div>
        <div class="summary-item">
          <div style="color: #6B7280; font-size: 10px; font-weight: 700; text-transform: uppercase;">
            Total ${isDues ? 'Outstanding Due' : 'Fee Amount Collected'}
          </div>
          <div class="summary-val" style="color: ${themeColor};">
            ₹${totalAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>USN / Roll</th>
            <th>Student Name</th>
            <th>Dept & Year</th>
            <th style="text-align: right;">Total Fee</th>
            <th style="text-align: right;">Paid</th>
            <th style="text-align: right;">Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>Generated by Kivquo Principal ERP Portal · Confidential Institutional Document</div>
        <div>Office of the Bursar & Controller of Accounts</div>
      </div>
    </body>
    </html>
  `;
}

export async function exportFeeListPDF(
  type: 'dues' | 'collected',
  records: StudentFeeRecord[],
  institutionName: string = 'KIVQUO Institute of Technology'
): Promise<void> {
  try {
    if (!records || records.length === 0) {
      Alert.alert('No Records', 'No fee records found to export.');
      return;
    }

    const html = buildFeeReportHtml(type, records, institutionName);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Export ${type === 'dues' ? 'Fee Dues' : 'Fee Collection'} PDF`,
        });
      } else {
        await Print.printAsync({ html });
      }
    }
  } catch (err: any) {
    console.error('[exportFeeListPDF error]:', err);
    Alert.alert('PDF Error', err?.message || 'Could not generate PDF report.');
  }
}

export function promptFeeExport(
  type: 'dues' | 'collected',
  records: StudentFeeRecord[],
  institutionName: string = 'KIVQUO Institute of Technology'
): void {
  const isDues = type === 'dues';
  const label = isDues ? 'Outstanding Due Fees' : 'Collected Fees';

  Alert.alert(
    `Export ${label}`,
    `Choose your preferred format to export all ${records.length} records:`,
    [
      {
        text: 'Download CSV (Excel/Sheets)',
        onPress: () => exportFeeListCSV(type, records, institutionName),
      },
      {
        text: 'Print / Save PDF Report',
        onPress: () => exportFeeListPDF(type, records, institutionName),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
}
