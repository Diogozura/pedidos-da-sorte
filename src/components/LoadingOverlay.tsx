// components/LoadingOverlay.tsx
'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingOverlay({ texto = 'Carregando...' }: { texto?: string }) {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 1300,
                width: '100vw',
                height: '100vh',
                bgcolor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff',
            }}
        >
            <CircularProgress color="inherit" />
            <Typography variant="body1" mt={2}>{texto}</Typography>
        </Box>
    );
}
