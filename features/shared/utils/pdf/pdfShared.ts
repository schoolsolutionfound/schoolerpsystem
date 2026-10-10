import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { useUserStore } from '../../../../store/useUserStore';

/** Escape a value for safe interpolation into report HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Indian-Rupee currency with locale grouping, preserving numeric sign.
 */
export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toLocaleString('en-IN');
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Indian-Rupee currency with fixed 2 decimal places, preserving numeric sign.
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toFixed(2);
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/** Institution display name from the user store, with fallback. */
export function getInstitutionName(): string {
  const userStore = useUserStore.getState();
  return userStore.institutionName || userStore.schoolName || '—';
}

/** Human-readable generation timestamp for report footers/meta boxes. */
export function formatGeneratedDate(date: Date = new Date()): string {
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Common A4 report stylesheet shared by the library / finance-statement /
 * attendance report generators. Report-specific classes (badges, receipt
 * cards, etc.) stay in each generator as extra CSS.
 */
export function baseReportCss(accent = '#10B981'): string {
  return `
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
      border-bottom: 3px solid ${accent};
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
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      color: ${accent};
      margin-top: 4px;
    }
    .meta {
      text-align: right;
      font-size: 10px;
      color: #4B5563;
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
    .kpi-val {
      font-size: 15px;
      font-weight: 800;
      margin-top: 4px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 4px solid ${accent};
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
  `;
}

/** Wraps report content in the standard HTML document shell. */
export function buildHtmlDocument(options: { title: string; css: string; content: string }): string {
  const { title, css, content } = options;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
${content}
</body>
</html>
  `;
}

/**
 * Print-to-PDF via expo-print with expo-sharing, handling web and
 * no-sharing fallbacks. Shared by all report generators.
 */
export async function sharePdf(html: string, dialogTitle: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
