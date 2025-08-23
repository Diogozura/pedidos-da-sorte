'use client';

import { Box, Typography, ButtonBase } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import * as React from 'react';

type ColorVariant = 'vermelho' | 'preto';
type SizeVariant = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  icon: React.ReactNode;
  color?: ColorVariant;
  onClick?: () => void;
  /** deixa o card “apagado” e não clicável */
  disabled?: boolean;
  /** linha extra de informação (ex.: “Em breve”, “2 novas”) */
  subtext?: string;
  /** opcional: controla dimensões do card (usa a convenção de size do MUI) */
  size?: SizeVariant;
};

const SIZES: Record<SizeVariant, { w: number; h: number; icon: number }> = {
  sm: { w: 140, h: 140, icon: 40 },
  md: { w: 160, h: 160, icon: 48 },
  lg: { w: 184, h: 184, icon: 56 },
};

export default function DashboardCard({
  title,
  icon,
  color = 'preto',
  onClick,
  disabled = false,
  subtext,
  size = 'md',
}: Props) {
  const theme = useTheme();
  const dims = SIZES[size];

  const palette: Record<ColorVariant, { bg: string; fg: string }> = {
    vermelho: { bg: '#BA0100', fg: '#FFFFFF' },
    preto: { bg: '#000000', fg: '#FFFFFF' },
  };

  const bgColor = disabled
    ? theme.palette.action.disabledBackground
    : palette[color].bg;

  const textColor = disabled
    ? theme.palette.text.disabled
    : palette[color].fg;

  return (
    <ButtonBase
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      sx={{
        width: dims.w,
        height: dims.h,
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        boxShadow: 2,
        transition: 'transform .2s, box-shadow .2s, background-color .2s, color .2s',
        '&:hover': disabled ? {} : { transform: 'scale(1.05)', boxShadow: 4 },
        '&:focus-visible': {
          outline: `2px solid ${disabled ? theme.palette.action.disabled : '#fff'}`,
          outlineOffset: 2,
        },
        p: 2,
      }}
    >
      <Box
        sx={{
          border: `2px solid ${disabled ? theme.palette.divider : '#FFFFFF'}`,
          borderRadius: '50%',
          width: dims.icon,
          height: dims.icon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(dims.icon * 0.55),
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="subtitle1"
        align="center"
        fontWeight={600}
        sx={{ mt: 1, lineHeight: 1.2 }}
      >
        {title}
      </Typography>

      {subtext && (
        <Typography
          variant="caption"
          align="center"
          sx={{ opacity: disabled ? 0.8 : 0.9 }}
        >
          {subtext}
        </Typography>
      )}
    </ButtonBase>
  );
}
