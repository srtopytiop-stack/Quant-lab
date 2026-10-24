import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quantitative Research & Risk Dashboard | لوحة أبحاث وتحليل المخاطر الكمية',
  description: 'محرك اتخاذ القرار المالي المتعدد الوكلاء (AQDE-Core) مع حارس مخاطر برمجي مستقل واختبار استراتيجيات.',
  openGraph: {
    title: 'Quantitative Research & Risk Dashboard | لوحة أبحاث وتحليل المخاطر الكمية',
    description: 'محرك اتخاذ القرار المالي المتعدد الوكلاء (AQDE-Core) مع حارس مخاطر برمجي مستقل واختبار استراتيجيات.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantitative Research & Risk Dashboard | لوحة أبحاث وتحليل المخاطر الكمية',
    description: 'محرك اتخاذ القرار المالي المتعدد الوكلاء (AQDE-Core) مع حارس مخاطر برمجي مستقل واختبار استراتيجيات.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
