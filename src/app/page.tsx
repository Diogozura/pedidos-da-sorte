
import BannerPrincipal from "@/components/BannerPrincipal";
import FeatureCard from "@/components/FeatureCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { faBolt, faBullseye, faTrophy, faUsers } from "@fortawesome/free-solid-svg-icons";
import { Box, Container, Grid, Typography } from "@mui/material";

export default function Home() {
  return (
    <>
      <Header />
      <BannerPrincipal />


      <Box sx={{ py: 8, backgroundColor: '#fff', textAlign: 'center' }}>

        <Typography component={'h2'} variant="body1" id="saiba-mais">🐞 Sobre Nós</Typography>
        <Box sx={{ py: 6, backgroundColor: '#fff' }}>
          <Container maxWidth="md">
            <Typography
              variant="h4"
              align="center"
              fontWeight="bold"
              gutterBottom
            >
              Transformamos Sonhos em <Box component="span" color="error.main">Realidade</Box>
            </Typography>

            <Typography
              variant="body1"
              align="center"
              color="text.secondary"
              sx={{ mt: 2, maxWidth: 700, mx: 'auto' }}
            >
              Somos uma empresa especializada em marketing digital e sorteios online,
              dedicada a criar experiências únicas que conectam marcas e pessoas através da emoção e da sorte.
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FeatureCard
                icon={faBullseye}
                title="Marketing Estratégico"
                description="Criamos campanhas personalizadas que conectam sua marca ao público certo no momento ideal."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FeatureCard
                icon={faUsers}
                title="Comunidade Ativa"
                description="Mais de 50 mil participantes engajados em nossa plataforma de sorteios e promoções."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FeatureCard
                icon={faTrophy}
                title="Resultados Comprovados"
                description="Histórico de sucesso com mais de 1000 sorteios realizados e prêmios entregues."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FeatureCard
                icon={faBolt}
                title="Tecnologia Inovadora"
                description="Plataforma segura e confiável com sistema de sorteios transparente e auditável."
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
