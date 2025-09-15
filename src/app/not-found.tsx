import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página não encontrada - Pedidos da Sorte',
  description: 'A página que você procura não foi encontrada.',
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #b30000 0%, #8b0000 100%)',
      color: '#fff',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '6rem', margin: '0', fontWeight: 'bold' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Página não encontrada</h2>
      <p style={{ fontSize: '1rem', margin: '1rem 0', maxWidth: '500px' }}>
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: '#fff',
          color: '#b30000',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Voltar ao início
      </Link>
    </div>
  );
}