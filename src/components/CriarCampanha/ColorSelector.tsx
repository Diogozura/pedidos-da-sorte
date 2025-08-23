'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeDropper, faCheck, faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons';

type Hex = `#${string}`;

export type CampanhaColors = {
  background: Hex;
  text: Hex;
};

type Props = {
  label?: string;
  value: CampanhaColors;
  onChange: (value: CampanhaColors) => void;
  size?: 'small' | 'medium' | 'large';
};

// Paleta base (você pode adaptar para paleta da marca/tema)
const PRESETS: Hex[] = [
  '#000000', '#121212', '#1F2937', '#334155', '#475569',
  '#0F766E', '#059669', '#16A34A', '#22C55E', '#84CC16',
  '#F59E0B', '#D97706', '#EA580C', '#DC2626', '#EF4444',
  '#7C3AED', '#6D28D9', '#8B5CF6', '#3B82F6', '#60A5FA',
  '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF',
];

// --- Util: contraste WCAG ---
function hexToRgb(hex: Hex): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const srgb = [r, g, b].map(v => v / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1: Hex, hex2: Hex): number {
  const L1 = relativeLuminance(hexToRgb(hex1));
  const L2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function bestTextOn(bg: Hex): Hex {
  const white: Hex = '#FFFFFF';
  const black: Hex = '#000000';
  const cWhite = contrastRatio(bg, white);
  const cBlack = contrastRatio(bg, black);
  return cWhite >= cBlack ? white : black;
}

function clampHex(input: string): Hex {
  let v = input.trim();
  if (!v.startsWith('#')) v = `#${v}`;
  if (v.length === 4) {
    // #abc -> #aabbcc
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  // queda de segurança — se não for hex válido, volta pro preto
  return /^#[0-9a-fA-F]{6}$/.test(v) ? (v as Hex) : '#000000';
}

export default function ColorSelector({
  label = 'Cor de fundo',
  value,
  onChange,
  size = 'medium',
}: Props) {
  const [open, setOpen] = useState(false);
  const [bgTemp, setBgTemp] = useState<Hex>(value.background);
  const [textTemp, setTextTemp] = useState<Hex>(value.text);

  // Sugestão automática de contraste
  const suggestedText: Hex = useMemo(() => bestTextOn(bgTemp), [bgTemp]);
  const ratio = useMemo(() => parseFloat(contrastRatio(bgTemp, textTemp).toFixed(2)), [bgTemp, textTemp]);
  const ratioSuggested = useMemo(() => parseFloat(contrastRatio(bgTemp, suggestedText).toFixed(2)), [bgTemp, suggestedText]);

  const handleOpen = () => {
    setBgTemp(value.background);
    setTextTemp(value.text);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange({ background: bgTemp, text: textTemp });
    setOpen(false);
  };

  const handlePresetClick = (c: Hex) => {
    setBgTemp(c);
    // ao trocar bg, se o texto atual perder contraste, ajusta para o sugerido
    const newBest = bestTextOn(c);
    if (contrastRatio(c, textTemp) < 4.5) setTextTemp(newBest);
  };

  const handleUseSuggested = () => setTextTemp(suggestedText);

  const handleQuickTextChoice = (_: unknown, val: 'black' | 'white' | null) => {
    if (!val) return;
    setTextTemp(val === 'black' ? '#000000' : '#FFFFFF');
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>

      {/* Preview compacto */}
      <Box
        sx={{
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            backgroundColor: value.background,
            color: value.text,
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Pré-visualização
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Título com contraste
            </Typography>
            <Typography variant="body2">
              Texto de exemplo sobre a campanha.
            </Typography>
          </Stack>

          <Stack alignItems="flex-end" spacing={1}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 0.75,
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.15)',
                  background: value.background,
                }}
                title={`Fundo: ${value.background}`}
              />
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 0.75,
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.15)',
                  background: value.text,
                }}
                title={`Texto: ${value.text}`}
              />
            </Box>
            <Tooltip title="Escolher cores">
              <Button
                onClick={handleOpen}
                size={size}
                variant="outlined"
                sx={{ color: value.text }}
                startIcon={<FontAwesomeIcon icon={faEyeDropper} />}
              >
                Alterar
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Selecionar cores</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {/* Seleção rápida de BG */}
            <Stack spacing={1}>
              <Typography variant="subtitle2">Cor de fundo</Typography>
              <Grid container spacing={1}>
                {PRESETS.map((c) => {
                  const active = c.toLowerCase() === bgTemp.toLowerCase();
                  return (
                    <Grid  key={c}>
                      <IconButton
                        onClick={() => handlePresetClick(c)}
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          border: active ? '2px solid currentColor' : '1px solid rgba(0,0,0,0.2)',
                          p: 0,
                          backgroundColor: c,
                          color: bestTextOn(c),
                        }}
                        aria-label={`Escolher ${c}`}
                      >
                        {active && <FontAwesomeIcon icon={faCheck} size="sm" />}
                      </IconButton>
                    </Grid>
                  );
                })}
              </Grid>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Hex"
                  size={'medium'}
                  value={bgTemp}
                  onChange={(e) => setBgTemp(clampHex(e.target.value))}
                  inputProps={{ maxLength: 7 }}
                />
                <TextField
                  label="Seletor"
                  size={'medium'}
                  type="color"
                  value={bgTemp}
                  onChange={(e) => setBgTemp(clampHex(e.target.value))}
                  sx={{ width: 80 }}
                />
              </Stack>
            </Stack>

            {/* Texto / contraste */}
            <Stack spacing={1}>
              <Typography variant="subtitle2">Cor do texto</Typography>

              <ToggleButtonGroup
                exclusive
                size={size}
                value={textTemp.toLowerCase() === '#000000' ? 'black' : textTemp.toLowerCase() === '#ffffff' ? 'white' : null}
                onChange={handleQuickTextChoice}
              >
                <ToggleButton value="black">Preto</ToggleButton>
                <ToggleButton value="white">Branco</ToggleButton>
              </ToggleButtonGroup>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Hex"
                  size={'medium'}
                  value={textTemp}
                  onChange={(e) => setTextTemp(clampHex(e.target.value))}
                  inputProps={{ maxLength: 7 }}
                />
                <TextField
                  label="Seletor"
                  size={'medium'}
                  type="color"
                  value={textTemp}
                  onChange={(e) => setTextTemp(clampHex(e.target.value))}
                  sx={{ width: 80 }}
                />
                <Button
                  onClick={handleUseSuggested}
                  size={size}
                  startIcon={<FontAwesomeIcon icon={faCircleHalfStroke} />}
                >
                  Usar contraste sugerido ({suggestedText})
                </Button>
              </Stack>

              {/* Preview + métricas */}
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: bgTemp,
                  color: textTemp,
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Pré-visualização
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Exemplo de título
                </Typography>
                <Typography variant="body2">Exemplo de texto.</Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Contraste atual (BG x Texto)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {ratio}:1 {ratio >= 4.5 ? '✅ AA' : ratio >= 3 ? '⚠️ AA (texto grande)' : '❌ Insuficiente'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Contraste sugerido
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {ratioSuggested}:1 com {suggestedText}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button size={size} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button size={size} variant="contained" onClick={handleConfirm}>
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
