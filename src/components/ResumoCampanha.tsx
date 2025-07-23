'use client';

import { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useUsuarioLogado } from '@/hook/useUsuarioLogado';
import { Campanha } from '@/types/Campanha';
import { Codigo } from '@/types/Codigo';


export default function ResumoCampanha() {
    const { usuario } = useUsuarioLogado();
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [codigosPorCampanha, setCodigosPorCampanha] = useState<Record<string, Codigo[]>>({});
    const [campanhaSelecionada, setCampanhaSelecionada] = useState<string>('');

    useEffect(() => {
        if (!usuario?.uid) return;

        const fetchCampanhasECodigos = async () => {
            let campSnap;

            if (usuario.nivel === 'admin') {
                // Admin vê todas
                campSnap = await getDocs(
                    query(
                        collection(db, 'campanhas'),
                        orderBy('criadoEm', 'desc')
                    )
                );
            } else {
                // Empresa ou funcionário só vê as da própria pizzaria
                campSnap = await getDocs(
                    query(
                        collection(db, 'campanhas'),
                        where('pizzariaId', '==', usuario.pizzariaId),
                        orderBy('criadoEm', 'desc')
                    )
                );
            }
            const campList: Campanha[] = [];
            const codesMap: Record<string, Codigo[]> = {};

            for (const campDoc of campSnap.docs) {
                const data = campDoc.data();
                const camp: Campanha = {
                    id: campDoc.id,
                    nome: data.nome,
                    modo: data.modo,
                    dataInicio: data.dataInicio?.toDate?.(),
                    dataFim: data.dataFim?.toDate?.(),
                    totalRaspadinhas: data.totalRaspadinhas,
                    raspadinhasRestantes: data.raspadinhasRestantes,
                    premiosTotais: data.premiosTotais,
                    premiosRestantes: data.premiosRestantes,
                };
                campList.push(camp);

                const codesSnap = await getDocs(
                    query(
                        collection(db, 'codigos'),
                        where('campanhaId', '==', campDoc.id)
                    )
                );

                const listaCodigos: Codigo[] = codesSnap.docs.map((cd) => {
                    const d = cd.data();
                    return {
                        id: cd.id,
                        codigo: d.codigo,
                        status: d.status,
                        criadoEm: d.criadoEm?.toDate?.() || new Date(),
                        usadoEm: d.usadoEm?.toDate?.(),
                        premiado: d.premiado,
                        premio: d.premio,
                        nomeGanhador: d.nomeGanhador,
                    };
                });

                codesMap[campDoc.id] = listaCodigos;
            }

            setCampanhas(campList);
            setCodigosPorCampanha(codesMap);
            if (campList.length > 0) setCampanhaSelecionada(campList[0].id);
        };

        fetchCampanhasECodigos();
    }, [usuario]);

    

    if (!campanhaSelecionada || campanhas.length === 0) return null;

    const campanha = campanhas.find((c) => c.id === campanhaSelecionada)!;
    const codigos = codigosPorCampanha[campanhaSelecionada] || [];

    const ganhadores = codigos
        .filter((c) => c.status === 'premiado')
        .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
        .slice(0, 5);

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    📊 Resumo da Campanha
                </Typography>

                {campanhas.length > 1 && (
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="campanha-label">Selecionar campanha</InputLabel>
                        <Select
                            labelId="campanha-label"
                            value={campanhaSelecionada}
                            label="Selecionar campanha"
                            onChange={(e) => setCampanhaSelecionada(e.target.value)}
                        >
                            {campanhas.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.nome}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <Box display="flex" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="body2">Modo</Typography>
                        <Typography variant="h6">
                            {campanha.modo === 'prazo' ? 'Prazo' : 'Raspadinha'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2">Raspadinhas Total</Typography>
                        <Typography variant="h5">{campanha.totalRaspadinhas}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2">Restantes</Typography>
                        <Typography variant="h5">{campanha.raspadinhasRestantes}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2">Prêmios Sorteados</Typography>
                        <Typography variant="h5">
                            {campanha.premiosTotais - campanha.premiosRestantes}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2">Prêmios Restantes</Typography>
                        <Typography variant="h5">{campanha.premiosRestantes}</Typography>
                    </Box>
                </Box>

                {campanha.modo === 'prazo' && (
                    <Box display="flex" gap={2} mb={2}>
                        <Box>
                            <Typography variant="body2">Início</Typography>
                            <Typography variant="body2">
                                {campanha.dataInicio?.toLocaleDateString() ?? '-'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2">Fim</Typography>
                            <Typography variant="body2">
                                {campanha.dataFim?.toLocaleDateString() ?? '-'}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    Últimos Ganhadores
                </Typography>
                {ganhadores.length > 0 ? (
                    ganhadores.map((g, idx) => (
                        <Typography key={idx} variant="body2">
                            {g.nomeGanhador ?? 'Anônimo'} — {g.premio ?? 'Prêmio desconhecido'} (
                            {g.criadoEm.toLocaleDateString()})
                        </Typography>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Nenhum ganhador ainda.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
