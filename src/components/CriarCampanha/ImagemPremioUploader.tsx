// src/components/CriarCampanha/ImagemPremioUploader.tsx
'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { toast } from 'react-toastify';
import ListaImagens from '../shared/ListaImagens';
import ImageCropDialog from './ImageCropDialog';

interface Props {
  preview: string;
  setPreview: (url: string) => void;
  setFile: (file: File | null) => void;
  usuarioId: string;
  imagensDisponiveis: string[];
  label?: string;
  tamanhoPreview?: number;
}

export default function ImagemPremioUploader({ 
  preview, 
  setPreview, 
  setFile, 
  imagensDisponiveis,
  label = "Imagem do Prêmio",
  tamanhoPreview = 80
}: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [cropDialogAberto, setCropDialogAberto] = useState(false);
  const [imagemParaCrop, setImagemParaCrop] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Abrir dialog de crop para qualquer imagem
    setImagemParaCrop(file);
    setCropDialogAberto(true);
    setModalAberto(false);
  };

  const handleCropComplete = (croppedFile: File) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    setFile(croppedFile);
    setPreview(previewUrl);
    setCropDialogAberto(false);
    setImagemParaCrop(null);
  };

  const handleCropCancel = () => {
    setCropDialogAberto(false);
    setImagemParaCrop(null);
  };

  const handleSelecionarExistente = (url: string) => {
    setPreview(url);
    setFile(null);
    setModalAberto(false);
  };

  return (
    <>
      {!preview ? (
        <>
          <Box
            onClick={() => setModalAberto(true)}
            sx={{
              display: 'grid',
              textAlign: 'center',
              border: '1px dashed #ccc',
              borderRadius: 2,
              width: tamanhoPreview,
              height: tamanhoPreview,
              cursor: 'pointer',
              bgcolor: 'grey.100',
              position: 'relative',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography fontSize={12} color="text.secondary">
              Selecionar<br />imagem
            </Typography>
          </Box>
        </>
      ) : (
        <>
          <Box display='flex' flexDirection='column' alignItems='start'>
            <Box
              component="img"
              src={preview}
              alt="Preview da imagem"
              sx={{ 
                width: tamanhoPreview, 
                height: tamanhoPreview, 
                objectFit: 'cover', 
                borderRadius: 1,
                border: '1px solid #ccc',
                cursor: 'pointer'
              }}
              onClick={() => setModalAberto(true)}
            />
            <Button 
              size="small" 
              onClick={() => setModalAberto(true)} 
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              Trocar
            </Button>
          </Box>
        </>
      )}

      {/* Modal de seleção */}
      <Dialog open={modalAberto} onClose={() => setModalAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle>Selecionar {label}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Imagens da biblioteca:
          </Typography>
          <ListaImagens
            imagens={imagensDisponiveis}
            imagemSelecionada={preview}
            onSelecionar={handleSelecionarExistente}
            tamanho={80}
          />

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Ou enviar nova imagem:
          </Typography>
          <Box
            component="label"
            htmlFor={`upload-premio-${Date.now()}`}
            sx={{
              display: 'grid',
              textAlign: 'center',
              border: '1px dashed #ccc',
              borderRadius: 2,
              width: '100%',
              height: 120,
              cursor: 'pointer',
              bgcolor: 'grey.100',
              position: 'relative',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography fontSize={14} color="text.secondary">
              Clique para enviar nova imagem<br />
              <small>(será ajustada para 500x500px)</small>
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        id={`upload-premio-${Date.now()}`}
        accept="image/*"
        onChange={handleChange}
      />

      {/* Dialog de Crop */}
      {imagemParaCrop && (
        <ImageCropDialog
          open={cropDialogAberto}
          onClose={handleCropCancel}
          imageFile={imagemParaCrop}
          onCropComplete={handleCropComplete}
          targetWidth={500}
          targetHeight={500}
        />
      )}
    </>
  );
}