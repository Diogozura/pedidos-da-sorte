'use client';

import { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Typography,
    Box,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';

interface Props {
    campanhaId: string;
    mostrar: 'premiados' | 'naoPremiados';
}

interface Posicao {
    posicao: string;
    premio: string | null;
    enviado: boolean;
    usado: boolean;
}

export default function NumerosPremiados({ campanhaId, mostrar }: Props) {
    const [dados, setDados] = useState<Posicao[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const buscar = async () => {
            try {
                const posicoesRef = collection(db, 'campanhas', campanhaId, 'posicoes');
                const snap = await getDocs(posicoesRef);

                const lista: Posicao[] = snap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        posicao: doc.id,
                        premio: data.prize ?? null,
                        enviado: !!data.enviado, // fallback para false
                        usado: !!data.usado,     // fallback para false
                    };
                });
                const filtrados = lista.filter((item) =>
                    mostrar === 'premiados' ? item.premio !== null : item.premio === null
                );
                setDados(filtrados);
            } catch (err) {
                console.error('Erro ao buscar posições:', err);
            } finally {
                setCarregando(false);
            }
        };

        if (campanhaId) buscar();
    }, [campanhaId, mostrar]);

    if (carregando) return <Typography>Carregando...</Typography>;

    console.log('dados.length', dados)

    if (!dados.length) {
        return (
            <Box mt={4}>
                <Typography align="center">
                    Nenhuma posição {mostrar === 'premiados' ? 'premiada' : 'não premiada'} encontrada.
                </Typography>
            </Box>
        );
    }

    return (
        <Box mt={4} component={Paper} elevation={2}>
            <Typography variant="h6" px={2} pt={2}>
                Números {mostrar === 'premiados' ? 'Premiados' : 'NÃO Premiados'}
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>


                <Table stickyHeader>
                    <TableHead >
                        <TableRow>
                            <TableCell>Posição</TableCell>
                            {mostrar === 'premiados' && <TableCell>Prêmio</TableCell>}
                            <TableCell>enviado</TableCell>
                            <TableCell>usado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dados.map((item) => (
                            <TableRow key={item.posicao}>
                                <TableCell>{item.posicao}</TableCell>
                                {mostrar === 'premiados' && <TableCell>{item.premio}</TableCell>}
                                <TableCell>{item.enviado ? 'Sim' : 'Não'}</TableCell>
                                <TableCell>{item.usado ? 'Sim' : 'Não'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}
