'use client';

import { Box, Typography, ButtonBase } from '@mui/material';

type Props = {
    title: string;
    icon: React.ReactNode;
    color?: 'vermelho' | 'preto';
    onClick: () => void;
};

export default function DashboardItemButton({
    title,
    icon,
    color = 'preto',
    onClick,
}: Props) {


    const bgColor = color === 'vermelho' ? '#BA0100' : '#000000';
    const textColor = '#FFFFFF';

    return (
        <ButtonBase
            onClick={onClick}
            sx={{
                width: 160,
                height: 160,
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'scale(1.05)',
                },
                padding: 2
            }}
        >
            <Box
                sx={{
                    border: '2px solid white',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,

                }}
            >
                {icon}
            </Box>

            <Typography
                variant="subtitle1"
                align="center"
                fontWeight={500}
                sx={{ mt: 1, fontSize: '1rem', lineHeight: 1.2 }}
            >
                {title}
            </Typography>
        </ButtonBase>
    );
}
