import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/theme/ThemeContext';
import ToastProvider from '@/components/ToastProvider';
import { FormProvider } from '@/config/FormContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pedidos da Sorte',
  description: 'Marketing & Sorteios com raspadinhas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <body className="font-inter">
        <ThemeProvider>

          <Header />
          <FormProvider>
            <main>{children}</main>

            <ToastProvider />
          </FormProvider>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
