import type { Metadata } from 'next';
import { Comfortaa } from 'next/font/google';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;
import { ThemeProvider } from '@/theme/ThemeContext';
import ToastProvider from '@/components/ToastProvider';
import { FormProvider } from '@/config/FormContext';
import { AuthProvider } from '@/context/AuthContext';
import Head from './head';

const inter = Comfortaa({
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
       <Head />
      <body className="font-inter">
        <ThemeProvider>
          <FormProvider>
            <AuthProvider>
              <main>{children}</main>
            </AuthProvider>
            <ToastProvider />
          </FormProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
