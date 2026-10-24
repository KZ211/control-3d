import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--fuente' });

export const metadata = {
  title: 'Control 3D',
  description: 'Ventas, costos y recuperación de la inversión de impresión 3D',
  robots: { index: false, follow: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#201F1C' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
