import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'KNOWFLOW • Rapid Knowledge Internalization',
  description: 'AI-powered structured learning platform turning complex academic research and textbooks into interactive knowledge graphs and active recall paths.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#F8FAFC] text-[#172033] antialiased selection:bg-[#635BDB] selection:text-white">
        {children}
      </body>
    </html>
  );
}
