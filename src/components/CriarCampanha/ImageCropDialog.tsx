// src/components/CriarCampanha/ImageCropDialog.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip
} from '@mui/material';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  targetWidth?: number;
  targetHeight?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropDialog({
  open,
  onClose,
  imageFile,
  onCropComplete,
  targetWidth = 300,
  targetHeight = 300
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState('');

  const aspect = targetWidth / targetHeight;

  // Quando o dialog abrir, criar URL da imagem
  useState(() => {
    if (open && imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  });

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }, [aspect]);

  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Atualizar preview canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const previewCtx = previewCanvas.getContext('2d');
      if (previewCtx) {
        const previewSize = Math.min(targetWidth, 150);
        previewCanvas.width = previewSize;
        previewCanvas.height = previewSize;
        
        previewCtx.drawImage(
          image,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          previewSize,
          previewSize
        );
      }
    }

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        }
      }, 'image/jpeg', 0.9);
    });
  }, [completedCrop, targetWidth, targetHeight, imageFile.name]);

  // Atualizar preview quando o crop mudar
  useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      generateCroppedImage();
    }
  }, [completedCrop, generateCroppedImage]);

  const handleSave = async () => {
    const croppedFile = await generateCroppedImage();
    if (croppedFile) {
      onCropComplete(croppedFile);
      onClose();
    }
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Ajustar Logo da Campanha</Typography>
          <Chip 
            label={`${targetWidth}x${targetHeight}px`} 
            size="small" 
            color="primary" 
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Ajuste a área da imagem que será usada como logo. A área selecionada será redimensionada para {targetWidth}x{targetHeight} pixels.
          </Typography>
        </Box>

        {imgSrc && (
          <Box display="flex" justifyContent="center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={50}
              minHeight={50}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imgSrc}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </Box>
        )}

        {/* Preview da área cropada */}
        {completedCrop && (
          <Box mt={3} textAlign="center">
            <Typography variant="subtitle2" gutterBottom>
              Preview da logo final:
            </Typography>
            <Box 
              display="inline-block" 
              border="1px solid #ccc" 
              borderRadius={2}
              p={1}
            >
              <canvas
                ref={previewCanvasRef}
                width={Math.min(targetWidth, 150)}
                height={Math.min(targetHeight, 150)}
                style={{ 
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!completedCrop}
        >
          Usar esta logo
        </Button>
      </DialogActions>
    </Dialog>
  );
}