'use client';

import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    AppBar,
    Toolbar,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Box,
    useTheme,
    useMediaQuery,
} from '@mui/material';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggleButton from './ThemeToggleButton';

const navLinks = [
    { label: 'Início', href: '/' },
    { label: 'Sobre', href: '/#saiba-mais' },
    // { label: 'Serviços', href: '/servicos' },
    // { label: 'Raspadinha', href: '/raspadinha' },
];

export default function Header() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [open, setOpen] = useState(false);

    const toggleDrawer = () => setOpen(!open);

    const drawer = (
        <Drawer anchor="right" open={open} onClose={toggleDrawer}>
            <Box width={250} role="presentation" onClick={toggleDrawer}>
                <List>
                    {navLinks.map((link) => (
                        <Link href={link.href} key={link.label} passHref>
                            <ListItem component="a">
                                <ListItemText primary={link.label} />
                            </ListItem>
                        </Link>
                    ))}
                    <ListItem>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            href="/auth/login"
                            sx={{ fontWeight: 'bold' }}
                        >
                            Login
                        </Button>
                    </ListItem>
                     <ThemeToggleButton />
                </List>
            </Box>
        </Drawer>
    );

    return (
        <>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* Logo + Título */}
                    <Box display="flex" alignItems="center" gap={1}>
                        <Image src="/Logo-original.png" alt="Logo" width={100} height={40} />
                       
                    </Box>

                    {/* Navegação */}
                    {isMobile ? (
                        <>
                            <IconButton edge="end" color="inherit" onClick={toggleDrawer}>
                                <FontAwesomeIcon icon={faBars} size="lg" />
                            </IconButton>
                            {drawer}
                        </>
                    ) : (
                        <Box display="flex" alignItems="center" gap={3}>
                            {navLinks.map((link) => (
                                <Button
                                    key={link.label}
                                    href={link.href}
                                    component={Link}
                                    sx={{ fontWeight: 500, color: 'text.primary' }}
                                >
                                    {link.label}
                                </Button>
                            ))}
                            <Button
                                variant="contained"
                                color="primary"
                                href="/auth/login"
                                sx={{ fontWeight: 'bold', borderRadius: 2, boxShadow: 2 }}
                            >
                                 Login
                            </Button>
                            <ThemeToggleButton />
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
        </>
    );
}
