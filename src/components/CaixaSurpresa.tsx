'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';

type Props = {
    width: number;
    height: number;
    premioImagem: string;
    premioNome: string;
    onComplete?: () => void;
    onReady?: () => void;
};

// Tipo local para chamadas aos métodos do Lottie sem usar `any`
type LottieControl = {
    playSegments?: (segments: [number, number], force?: boolean) => void;
    goToAndStop?: (frame: number, isFrame?: boolean) => void;
    goToAndPlay?: (frame: number, isFrame?: boolean) => void;
    play?: () => void;
};

export default function CaixaSurpresa({
    width,
    height,
    premioImagem,
    premioNome,
    onComplete,
    onReady,
}: Props) {
    const [animationData, setAnimationData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [estado, setEstado] = useState<'fechada' | 'abrindo' | 'aberta'>('fechada');
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const clickLottieRef = useRef<LottieRefCurrentProps>(null);
    const clickRef = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [frameRange] = useState({ start: 20, end: 30 });
    const [intervalTime] = useState(1100);
    const [totalFrames, setTotalFrames] = useState(0);
    const [showClickLottie, setShowClickLottie] = useState(false);
    const [premioCarregado, setPremioCarregado] = useState(false);

    // Adiciona keyframes para animação de fade/scale
    const fadeInPrize = {
        animation: `fadeInPrize 700ms ease forwards` // <-- altere o tempo aqui (700ms)
    };

    // Função para iniciar a animação periódica da caixa (movimento)
    const iniciarAnimacaoCaixaMexendo = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            if (estado === 'fechada' && lottieRef.current && !clickRef.current) {
                (lottieRef.current as unknown as LottieControl).playSegments?.([frameRange.start, frameRange.end], true);
            }
        }, intervalTime);
    }, [frameRange, intervalTime, estado]);


    useEffect(() => {
        // Carregando o arquivo JSON - vamos fazer um ajuste aqui
        fetch('/animations/surprise-box.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Animação carregada com sucesso:', data);
                setAnimationData(data);
                setLoading(false);

                if (data.op) {
                    setTotalFrames(data.op);
                }

                // Configurar a animação quando estiver carregada
                setTimeout(() => {
                    if (lottieRef.current) {
                        // Definir para iniciar no frame 0 (caixa visível)
                        lottieRef.current.goToAndStop(0, true);

                        // Iniciar animação periódica da caixa
                        iniciarAnimacaoCaixaMexendo();
                    }
                }, 100);

                if (!clickRef.current) {
                    onReady?.();
                }
            })
            .catch(error => {
                console.error('Erro ao carregar a animação:', error);
                setLoading(false);
                setEstado('fechada');
            });

        // Limpar intervalo ao desmontar
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [onReady, iniciarAnimacaoCaixaMexendo]);



    // Função para lidar com o clique na caixa
    const handleClick = () => {
        if (estado !== 'fechada' || clickRef.current) return;
        clickRef.current = true;
        setEstado('abrindo');
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setShowClickLottie(true);
        setPremioCarregado(false);
        setTimeout(() => {
            if (clickLottieRef.current) {
                const control = clickLottieRef.current as unknown as LottieControl;
                control.goToAndStop?.(0, true);
                setTimeout(() => {
                    if (totalFrames && totalFrames > 0 && control.playSegments) {
                        control.playSegments([0, totalFrames], true);
                    } else if (control.play) {
                        control.play();
                    } else {
                        control.goToAndPlay?.(0, true);
                    }
                    // Altere o tempo do atraso do prêmio aqui (ex: 900ms)
                    setTimeout(() => setPremioCarregado(true), 1400);
                }, 80);
            }
        }, 10);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2
                }}
            >
                <CircularProgress size={40} />
            </Box>
        );
    }
    return (
        <Box
            sx={{
                position: 'relative',
                width,
                height,
                margin: 'auto',
                cursor: estado === 'fechada' ? 'pointer' : 'default',
                userSelect: 'none',
            }}
            onClick={handleClick}
        >
            {/* Lottie original: animação periódica */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    '&:hover': estado === 'fechada' ? {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.3s ease',
                    } : {},
                    bgcolor: animationData ? 'transparent' : '#ff5252',
                    borderRadius: 2,
                    border: animationData ? 'none' : '4px dashed #ffeb3b',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                }}
            >
                {animationData ? (
                    <Lottie
                        lottieRef={lottieRef}
                        animationData={animationData}
                        loop={false}
                        autoplay={false}
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <Typography variant="h6" fontWeight="bold" color="#fff">
                        🎁 Clique para abrir
                    </Typography>
                )}
            </Box>
            {/* Lottie duplicado: roda a animação completa ao clicar */}
            {showClickLottie && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Lottie
                        lottieRef={clickLottieRef}
                        animationData={animationData}
                        loop={false}
                        autoplay={false}
                        style={{ width: '100%', height: '100%' }}
                        onComplete={() => {
                            setEstado('aberta');
                            setPremioCarregado(true);
                            setTimeout(() => onComplete?.(), 3500);
                        }}
                    />
                    {premioCarregado && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 'calc(10% + 30px)',
                                left: '10%', // mais centralizado
                                width: '80%', // aumenta largura
                                height: '60%', // aumenta altura
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 4,
                                opacity: 1,
                                ...fadeInPrize // Aplica animação
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: width * 0.6, // aumenta tamanho da imagem
                                    height: height * 0.42,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Image
                                    src={premioImagem}
                                    alt={premioNome}
                                    fill
                                    sizes={`${Math.round(width * 0.6)}px`}
                                    style={{ objectFit: 'contain' }}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
            {/* Adiciona global style para keyframes */}
            <style jsx global>{`
@keyframes fadeInPrize {
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`}</style>
        </Box>
    )
}