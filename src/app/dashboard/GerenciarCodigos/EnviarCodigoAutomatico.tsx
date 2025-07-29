/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles';

type Props = {
  onSend: (telefone: string) => Promise<void> | void;
};

export default function EnviarCodigoAutomatico({ onSend }: Props) {
  const theme = useTheme();
  const [telefones, setTelefones] = useState<string[]>([]);
  const [enviados, setEnviados] = useState<string[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const linhas = text.split('\n').map((l) => l.trim().replace(/\r/g, ''));
      const validos = linhas.filter((l) => /^[0-9]{10,11}$/.test(l.replace(/\D/g, '')));
      const invalidos = linhas.filter((l) => !validos.includes(l));

      setTelefones(validos);
      setErros(invalidos);
      toast.info(`Carregados ${validos.length} números válidos`);
    };
    reader.readAsText(file);
  };

  const processarEnvio = async () => {
    if (telefones.length === 0) {
      toast.warning('Nenhum telefone válido carregado.');
      return;
    }

    setLoading(true);
    const enviadosSucesso: string[] = [];

    for (const tel of telefones) {
      try {
        await onSend(tel);
        enviadosSucesso.push(tel);
      } catch (error) {
        toast.error(`Erro ao enviar para ${tel}`);
      }
    }

    setEnviados(enviadosSucesso);
    setLoading(false);
    toast.success(`${enviadosSucesso.length} enviados com sucesso!`);
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        p: 4,
      }}
    >
      <CardContent>
        <Typography variant="h6" align="center" fontWeight="bold" gutterBottom>
          Envio Automático por CSV
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button
            variant="outlined"
            component="label"
            sx={{ fontWeight: 'bold' }}
          >
            Importar CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleCSVUpload}
            />
          </Button>

          {telefones.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={processarEnvio}
              disabled={loading}
            >
              {loading ? 'Enviando...' : `Enviar ${telefones.length} números`}
            </Button>
          )}

          {loading && <LinearProgress />}

          {enviados.length > 0 && (
            <Typography variant="body2" color="success.main">
              ✅ Enviados com sucesso: {enviados.length}
            </Typography>
          )}

          {erros.length > 0 && (
            <Box>
              <Typography variant="body2" color="error">
                ⚠️ Números inválidos: {erros.length}
              </Typography>
              <List dense>
                {erros.slice(0, 5).map((e, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={e} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
