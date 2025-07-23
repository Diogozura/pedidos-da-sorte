'use client';

import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot, faHeart, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

export default function Footer() {
  return (
    <Box sx={{ backgroundColor: '#0C1121', color: '#fff', pt: 6, pb: 2, mt: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Marca */}
          <Grid size={{xs:12,  sm:6, md:3}}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Image src="/Logo-branca.png" alt="Logo" width={100} height={40} />
              
            </Box>
            <Typography variant="body2" mt={1}>
              Transformamos sonhos em realidade através de campanhas inovadoras e sorteios emocionantes.
            </Typography>
          </Grid>

          {/* Links rápidos */}
          <Grid size={{xs:12,  sm:6, md:3}}>
            <Typography fontWeight="bold" mb={1}>
              Links Rápidos
            </Typography>
            {['Início', 'Sobre Nós', 'Serviços', 'Raspadinha'].map((item) => (
              <Typography key={item}>
                <Link href="#" color="inherit" underline="hover">
                  {item}
                </Link>
              </Typography>
            ))}
          </Grid>

          {/* Serviços */}
          <Grid size={{xs:12,  sm:6, md:3}} >
            <Typography fontWeight="bold" mb={1}>
              Serviços
            </Typography>
            {[
              'Campanhas de Marketing',
              'Sorteios Personalizados',
              'Análise e Relatórios',
              'Segurança e Transparência',
            ].map((item) => (
              <Typography key={item}>
                <Link href="#" color="inherit" underline="hover">
                  {item}
                </Link>
              </Typography>
            ))}
          </Grid>

          {/* Contato */}
          <Grid size={{xs:12,  sm:6, md:3}}>
            <Typography fontWeight="bold" mb={1}>
              Contato
            </Typography>
            <Typography display="flex" alignItems="center" gap={1}>
              <FontAwesomeIcon icon={faEnvelope} /> contato@pedidosdasorte.com.br
            </Typography>
            <Typography display="flex" alignItems="center" gap={1}>
              <FontAwesomeIcon icon={faPhone} /> (11) 9 9999-9999
            </Typography>
            <Typography display="flex" alignItems="center" gap={1}>
              <FontAwesomeIcon icon={faLocationDot} /> São Paulo, SP - Brasil
            </Typography>
          </Grid>
        </Grid>

        <Box mt={4} borderTop="1px solid #1d2233" pt={2} display="flex" justifyContent="space-between" flexWrap="wrap">
          <Typography variant="body2">
            © 2025 Pedidos da Sorte. Todos os direitos reservados.
          </Typography>
          <Typography variant="body2" display="flex" alignItems="center" gap={1}>
            Feito com <FontAwesomeIcon icon={faHeart} color="#f44336" /> para você
            <IconButton size="small" sx={{ color: '#fff', background: '#f44336', ml: 1 }} href="#">
              <FontAwesomeIcon icon={faArrowUp} />
            </IconButton>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
