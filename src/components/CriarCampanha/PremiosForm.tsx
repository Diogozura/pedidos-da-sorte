// src/components/CriarCampanha/PremiosForm.tsx
'use client';

import { Box, Button, Grid, IconButton, InputAdornment, TextField, Typography, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ChangeEvent, useState } from 'react';
import { toast } from 'react-toastify';
import ListaImagens from '../shared/ListaImagens';
import { useRef } from 'react';

export interface Premio {
  nome: string;
  imagem: string;
  quantidadeTotais: number;
  file?: File | null;
  preview?: string;
}

interface Props {
  premios: Premio[];
  setPremios: (premios: Premio[]) => void;
  imagensDisponiveis: string[];
  setImagensDisponiveis: (imgs: string[]) => void;
  usuarioId: string;
}

export default function PremiosForm({ premios, setPremios, imagensDisponiveis }: Props) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const adicionarPremio = () => {
    setPremios(prev => [...prev, { nome: '', imagem: '', quantidadeTotais: 1, file: null, preview: '' }]);
  };

  const removerPremio = (index: number) => {
    setPremios(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangePremio = (index: number, field: keyof Premio, value: string) => {
    const novos = [...premios];
    if (field === 'quantidadeTotais') {
      novos[index].quantidadeTotais = parseInt(value) || 1;
    } else {
      novos[index][field] = value;
    }
    setPremios(novos);
  };

  const handleUploadImagem = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      toast.error('A imagem deve ter menos de 100 KB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      if (img.width !== 500 || img.height !== 500) {
        toast.error('A imagem precisa ter exatamente 500×500 px.');
        return;
      }
      setPremios(prev => {
        const copia = [...prev];
        copia[index].file = file;
        copia[index].preview = previewUrl;
        return copia;
      });
    };
  };

  const handleSelecionarImagem = (url: string, index: number) => {
    const novos = [...premios];
    novos[index].imagem = url;
    novos[index].file = null;
    novos[index].preview = '';
    setPremios(novos);
    setModalIndex(null);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>Prêmios</Typography>
      {premios.map((p, index) => (
        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                label="Nome do prêmio"
                value={p.nome}
                onChange={(e) => handleChangePremio(index, 'nome', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Quantidade"
                type="number"
                value={p.quantidadeTotais}
                onChange={(e) => handleChangePremio(index, 'quantidadeTotais', e.target.value)}
                InputProps={{ endAdornment: <InputAdornment position="end">x</InputAdornment> }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" mb={1}>Imagem selecionada</Typography>
              {p.preview ? (
                <Box component="img" src={p.preview} sx={{ width: 80, height: 80, borderRadius: 1 }} />
              ) : p.imagem ? (
                <Box component="img" src={p.imagem} sx={{ width: 80, height: 80, borderRadius: 1 }} />
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhuma imagem selecionada</Typography>
              )}
              <Box display="flex" gap={2} mt={1}>
                <Button variant="outlined" onClick={() => setModalIndex(index)}>Escolher imagem</Button>

              </Box>
            </Grid>
            {premios.length >= 3 && (
              <Grid item xs={12} sm={1}>
                <IconButton onClick={() => removerPremio(index)}>
                  <FontAwesomeIcon icon={faMinus} />
                </IconButton>
              </Grid>
            )}
          </Grid>

          {/* Modal de seleção de imagem */}
          <Dialog open={modalIndex === index} onClose={() => setModalIndex(null)} fullWidth maxWidth="xs">
            <DialogTitle>Selecionar imagem do prêmio</DialogTitle>
            <DialogContent>
              <ListaImagens
                imagens={imagensDisponiveis}
                imagemSelecionada={p.imagem}
                onSelecionar={(url) => handleSelecionarImagem(url, index)}
                tamanho={80}
              />
              <Box mt={2}>
                <Button variant="outlined" onClick={() => inputRef.current?.click()}>
                  Enviar nova imagem
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    if (modalIndex !== null) {
                      handleUploadImagem(e, modalIndex);
                      if (inputRef.current) inputRef.current.value = ''; // limpa valor anterior
                    }
                  }}
                />
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      ))}

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
