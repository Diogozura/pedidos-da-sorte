// src/components/shared/ListaImagens.tsx
'use client';

import { Box } from '@mui/material';

interface ListaImagensProps {
  imagens: string[];
  imagemSelecionada: string;
  onSelecionar: (url: string) => void;
  tamanho?: number;
}

export default function ListaImagens({
  imagens,
  imagemSelecionada,
  onSelecionar,
  tamanho = 80
}: ListaImagensProps) {
  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {imagens.map((url, idx) => (
        <Box
          key={idx}
          component="img"
          src={url}
          alt={`Imagem ${idx + 1}`}
          onClick={() => onSelecionar(url)}
          sx={{
            width: tamanho,
            height: tamanho,
            objectFit: 'cover',
            borderRadius: 1,
            cursor: 'pointer',
            border: imagemSelecionada === url ? '2px solid #1976d2' : '1px solid #ccc'
          }}
        />
      ))}
    </Box>
  );
}
