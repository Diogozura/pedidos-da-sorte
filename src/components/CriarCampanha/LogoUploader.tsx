// src/components/CriarCampanha/LogoUploader.tsx
'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { toast } from 'react-toastify';
import ListaImagens from '../shared/ListaImagens';

interface Props {
  preview: string;
  setPreview: (url: string) => void;
  setFile: (file: File | null) => void;
  usuarioId: string;
  logosDisponiveis: string[];
}


export default function LogoUploader({ preview, setPreview, setFile, logosDisponiveis }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      setFile(file);
      setPreview(previewUrl);
    };
  };
  console.log('preview', preview)
  return (
    <>
      <Typography variant="h6" gutterBottom>Logo da Campanha</Typography>

      {preview.length === 0 ? (
        <>
          <Box
            component="label"

            sx={{
              display: 'grid',
              textAlign: 'center',
              border: '1px dashed #ccc',
              borderRadius: 2,
              width: 200,
              height: 200,
              cursor: 'pointer',
              bgcolor: 'grey.100',
              mt: 3,
              position: 'relative',
              overflow: 'hidden',

              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography fontSize={14} color="text.secondary">
              Adicionar logo da campanha
            </Typography>
          </Box>
          <Button onClick={() => setModalAberto(true)} sx={{ mt: 2 }}>
            Selecionar logo
          </Button>
          <Dialog open={modalAberto} onClose={() => setModalAberto(false)} fullWidth maxWidth="xs">
            <DialogTitle>Selecionar outra logo</DialogTitle>
            <DialogContent>
              <ListaImagens
                imagens={logosDisponiveis}
                imagemSelecionada={preview}
                onSelecionar={(url) => {
                  setPreview(url);
                  setFile(null);
                  setModalAberto(false);
                }}
                tamanho={80}
              />
              <Button>Adicionar nova logo</Button>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Logo atual selecionada abaixo. Você pode trocar, se desejar:
          </Typography>
          <Box display='grid' justifyItems={'start'}>


            <Box
              component="img"
              src={preview}
              alt="Logo preview"
              sx={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 2, border: '1px solid #ccc' }}
            />

            <Button onClick={() => setModalAberto(true)} sx={{ mt: 2 }}>
              Trocar logo
            </Button>
          </Box>
          <Dialog open={modalAberto} onClose={() => setModalAberto(false)} fullWidth maxWidth="xs">
            <DialogTitle>Selecionar outra logo</DialogTitle>
            <DialogContent>
              <ListaImagens
                imagens={logosDisponiveis}
                imagemSelecionada={preview}
                onSelecionar={(url) => {
                  setPreview(url);
                  setFile(null);
                  setModalAberto(false);
                }}
                tamanho={80}
              />

              <Box
                component="label"
                htmlFor="upload-logo"
                sx={{
                  display: 'grid',
                  textAlign: 'center',
                  border: '1px dashed #ccc',
                  borderRadius: 2,
                  width: '100%',
                  height: 120,
                  cursor: 'pointer',
                  bgcolor: 'grey.100',
                  mt: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography fontSize={14} color="text.secondary">
                  Adicionar nova logo
                </Typography>
              </Box>
            </DialogContent>
          </Dialog>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        id="upload-logo"
        accept="image/*"
        onChange={handleChange}
      />

    </>
  );
}