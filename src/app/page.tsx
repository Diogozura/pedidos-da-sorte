
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Container, Typography } from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignItems: 'center', justifyContent: 'center' }}>

        <Typography component={'h1'} variant="h2">Sorteio divertidos e muito Raspadinha</Typography>

        <Typography component={'h2'} variant="h5"><Link href="/sorteio">acesse Sorteio</Link></Typography>
      </Container>
      <Footer/>
    </>
  );
}
