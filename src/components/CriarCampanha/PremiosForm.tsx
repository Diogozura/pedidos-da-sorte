// src/components/CriarCampanha/PremiosForm.tsx
'use client';

import { Box, Button, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';
import ImagemPremioUploader from './ImagemPremioUploader';

export interface Premio {
  nome: string;
  imagem: string;
  quantidadeTotais: number;
  file?: File | null;
  preview?: string;
}

interface Props {
  premios: Premio[];
  setPremios: React.Dispatch<React.SetStateAction<Premio[]>>;
  imagensDisponiveis: string[];
  setImagensDisponiveis: (imgs: string[]) => void;
  usuarioId: string;
}

export default function PremiosForm({ premios, setPremios, imagensDisponiveis, usuarioId }: Props) {
  const adicionarPremio = () => {
    setPremios((prev: Premio[]) => [
      ...prev,
      { nome: '', imagem: '', quantidadeTotais: 1, file: null, preview: '' }
    ]);
  };

  const removerPremio = (index: number) => {
    setPremios(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangePremio = (index: number, field: keyof Premio, value: string) => {
    const novos = [...premios];
    if (field === 'quantidadeTotais') {
      novos[index].quantidadeTotais = parseInt(value) || 1;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      novos[index][field] = value as any;
    }
    setPremios(novos);
  };

  useEffect(() => {
    if (premios.length === 0) {
      setPremios([
        {
          nome: '',
          imagem: '',
          quantidadeTotais: 1,
          file: null,
          preview: ''
        }
      ]);
    }
  }, [premios.length, setPremios]);

  return (
    <>
      <Box height={premios.length == 1 ? 150 : 250} overflow="auto" sx={{ mb: 2 }}>
        {premios.map((p, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Nome do prêmio"
                  value={p.nome}
                  required
                  onChange={(e) => handleChangePremio(index, 'nome', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Quantidade"
                  type="number"
                  value={p.quantidadeTotais}
                  onChange={(e) => handleChangePremio(index, 'quantidadeTotais', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">x</InputAdornment> }}
                  fullWidth
                />
              </Grid>
              <Grid size={2}>
                <ImagemPremioUploader
                  preview={p.preview || p.imagem}
                  // IMPORTANTE: o componente filho dispara setFile(croppedFile) e DEPOIS setPreview(previewUrl).
                  // Se chamarmos handleImagemChange nas duas chamadas, a segunda (setPreview) perde a referência ao File
                  // e grava o blob: URL em "imagem". Para evitar isso, só atualizamos imagem quando NÃO existe um file registrado.
                  setPreview={(url) => {
                    setPremios(prev => {
                      const copia = [...prev];
                      const alvo = copia[index];
                      // Se já temos um file (upload novo), manter file e preview atuais; não salvar blob em imagem
                      if (!alvo.file) {
                        alvo.imagem = url; // imagem da biblioteca
                        alvo.preview = '';
                      } else {
                        // Apenas atualiza o preview visual se por algum motivo ainda não setado
                        if (!alvo.preview) alvo.preview = url;
                      }
                      return copia;
                    });
                  }}
                  setFile={(file) => {
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setPremios(prev => {
                        const copia = [...prev];
                        const alvo = copia[index];
                        alvo.file = file;
                        alvo.preview = previewUrl; // mostrado na UI
                        alvo.imagem = ''; // será definido após upload na criação
                        return copia;
                      });
                    }
                  }}
                  usuarioId={usuarioId}
                  imagensDisponiveis={imagensDisponiveis}
                  tamanhoPreview={80}
                />
              </Grid>
              {premios.length >= 2 && (
                <Grid size={{ xs: 12, sm: 1 }}>
                  <IconButton onClick={() => removerPremio(index)}>
                    <FontAwesomeIcon icon={faMinus} />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}
      </Box>
      <Button
        onClick={adicionarPremio}
        variant="outlined"
        sx={{ mb: 4 }}
        startIcon={<FontAwesomeIcon icon={faPlus} />}
      >
        Adicionar prêmio
      </Button>
    </>
  );
}
