'use client';

import { useState } from 'react';
import { Container, Box, Typography, Paper, Button, TextField } from '@mui/material';
import CaixaSurpresa from '@/components/CaixaSurpresa';

export default function TesteCaixaSurpresa() {
  const [resultado, setResultado] = useState<string | null>(null);
  
  // Parâmetros configuráveis para teste
  const [premioImagem, setPremioImagem] = useState('/premios/pizza.png');
  const [premioNome, setPremioNome] = useState('Pizza');
  const [loading, setLoading] = useState(false);
  
  const handleComplete = () => {
    setLoading(true);
    
    // Simula um tempo de carregamento do resultado do servidor
    setTimeout(() => {
      setResultado(`Prêmio revelado: ${premioNome}`);
      setLoading(false);
    }, 1000);
  };
  
  const resetTeste = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Caixa Surpresa com Lottie Animation
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 4 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configurações
            </Typography>
            
            <TextField 
              label="URL da imagem do prêmio" 
              fullWidth
              value={premioImagem}
              onChange={(e) => setPremioImagem(e.target.value)}
              size="small"
              helperText="Ex: /premios/pizza.png"
            />
            
            <TextField 
              label="Nome do prêmio" 
              fullWidth
              value={premioNome}
              onChange={(e) => setPremioNome(e.target.value)}
              size="small"
            />
            
            <Button 
              variant="contained" 
              color="primary"
              onClick={resetTeste}
              sx={{ mt: 2 }}
            >
              Reiniciar Teste
            </Button>
          </Box>
          
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 350,
            bgcolor: 'background.default',
            borderRadius: 2,
            p: 2
          }}>
            <Typography variant="subtitle1" gutterBottom>
              Clique na caixa para ver o prêmio
            </Typography>
            
            <CaixaSurpresa
              width={280}
              height={280}
              premioImagem={premioImagem}
              premioNome={premioNome}
              onComplete={handleComplete}
              onReady={() => console.log("Animação pronta!")}
            />
            
            {loading && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Processando resultado...
              </Typography>
            )}
            
            {resultado && !loading && (
              <Typography 
                variant="h6" 
                sx={{ mt: 2, color: 'success.main', fontWeight: 'bold' }}
              >
                {resultado}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Este é um ambiente de testes. As imagens precisam existir no diretório public.
      </Typography>
    </Container>
  );
}