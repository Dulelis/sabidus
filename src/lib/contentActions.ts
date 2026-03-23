import * as Print from 'expo-print';
import { Share } from 'react-native';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintDocument(options: {
  title: string;
  subtitle?: string;
  body: string[];
}) {
  const paragraphs = options.body
    .map((item) => item.trim())
    .filter(Boolean)
    .map(
      (item) =>
        `<p style="font-size:14px;line-height:1.6;color:#243447;margin:0 0 12px;">${escapeHtml(
          item
        )}</p>`
    )
    .join('');

  return `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
        <h1 style="margin-bottom: 8px;">${escapeHtml(options.title)}</h1>
        ${
          options.subtitle
            ? `<div style="margin-bottom: 16px; color: #475569;">${escapeHtml(options.subtitle)}</div>`
            : ''
        }
        ${paragraphs}
      </body>
    </html>
  `;
}

export async function shareStudyContent(options: {
  title: string;
  message: string;
  url?: string;
}) {
  const message = [options.title.trim(), options.message.trim(), options.url?.trim() || '']
    .filter(Boolean)
    .join('\n\n');

  await Share.share({
    message,
    title: options.title,
  });
}

export async function printStudyContent(options: {
  title: string;
  subtitle?: string;
  body: string[];
}) {
  const html = buildPrintDocument(options);

  if (typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');

    if (!printWindow) {
      throw new Error('Nao foi possivel abrir a janela de impressao.');
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return;
  }

  await Print.printAsync({ html });
}
