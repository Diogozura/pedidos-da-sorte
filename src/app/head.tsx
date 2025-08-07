export default function Head() {

  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Pedidos da Sorte",
        "url": "https://sorteio.pedidodasorte.com.br",
        "logo": "https://sorteio.pedidodasorte.com.br/Logo-original.png",
        "description": "Pedidos da sorte , marketing para seu negocio. ",
        "sameAs": ["https://instagram.com/pedidosdasorte"]
      })
    }}
  ></script>
  return (
    <>
      <meta name="description" content="Pedidos da sorte , marketing para seu negocio" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <meta name="robots" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content="Pedidos da sorte" />
      <meta property="og:description" content="Pedidos da sorte , marketing para seu negocio." />
      <meta property="og:image" content="https://sorteio.pedidodasorte.com.br/og-image.png" />
      <meta property="og:url" content="https://sorteio.pedidodasorte.com.br" />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pedidos da sorte" />
      <meta name="twitter:description" content="Pedidos da sorte , marketing para seu negocio." />
      <meta name="twitter:image" content="https://sorteio.pedidodasorte.com.br/og-image.png" />

      <link rel="icon" href="/favicon/favicon.ico" />


    </>
  );
}
