'use client';

import {
    Card,
    CardActionArea,
    CardContent,
    Typography,
    useTheme,
} from '@mui/material';

type Props = {
    title: string;
    description: string;
    icon?: React.ReactNode;
    onClick: () => void;
};

export default function DashboardCard({ title, description, icon, onClick }: Props) {
    const theme = useTheme();
    return (
        <CardActionArea onClick={onClick} >
            <Card sx={{
                height: '100%',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                    boxShadow: `0 0 10px ${theme.palette.primary.main}`,
                },
            }}
            >
                <CardContent>
                    <Typography variant="h6">
                        {icon} {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </CardContent>
            </Card>
        </CardActionArea>
    );
}
