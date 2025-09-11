'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

type Props = {
    width: number;
    height: number;
    premioImagem: string;
    premioNome: string;
    onComplete?: () => void;
    onReady?: () => void;
};

// Animações para o prêmio
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const bounce = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  75% { transform: scale(0.95); }
  100% { transform: scale(1); }
`;

export default function CaixaSurpresa({
    width,
    height,
    premioImagem,
    premioNome,
    onComplete,
    onReady,
}: Props) {
    const [animationData, setAnimationData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [estado, setEstado] = useState<'fechada' | 'abrindo' | 'aberta'>('fechada');
    const [premioCarregado, setPremioCarregado] = useState(false);
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const clickRef = useRef(false);
    // Adicione depois das outras refs
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [debugMode, setDebugMode] = useState(false);
    const [frameRange, setFrameRange] = useState({ start: 20, end: 30 });
    const [intervalTime, setIntervalTime] = useState(1100);
    const [totalFrames, setTotalFrames] = useState(0);


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

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'd' && e.ctrlKey) {
                setDebugMode(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        // Limpar intervalo ao desmontar
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [onReady]);

    // Adicione esta função logo após os useState e useRef
    const iniciarAnimacaoCaixaMexendo = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            // Só anima se estiver no estado fechada e não estiver clicada
            if (estado === 'fechada' && lottieRef.current && !clickRef.current) {
                // Usar os valores do estado frameRange
                lottieRef.current.playSegments([frameRange.start, frameRange.end], true);
            }
        }, intervalTime); // Usar o valor do estado intervalTime
    };

    // Adicione esta função para testar frames específicos
    const testarFrames = (start: number, end: number) => {
        if (lottieRef.current) {
            lottieRef.current.goToAndStop(start, true);
            setTimeout(() => {
                lottieRef.current?.playSegments([start, end], true);
            }, 100);
        }
    };
    useEffect(() => {
        if (debugMode) {
            iniciarAnimacaoCaixaMexendo();
        }
    }, [frameRange, intervalTime, debugMode]);
    // Remova o segundo useEffect para evitar chamar onReady duas vezes

    // Função para lidar com o clique na caixa
    // Modifique a função handleClick no seu componente CaixaSurpresa
    const handleClick = () => {
        if (estado !== 'fechada' || clickRef.current) return;

        clickRef.current = true;
        setEstado('abrindo');

        // Parar animação de movimento
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Inicia a animação Lottie completa
        if (lottieRef.current) {
            // Ir para o frame 0 e tocar a animação completa
            lottieRef.current.goToAndPlay(0, true);

            // Em vez de usar addEventListener, vamos usar um timeout
            // com duração aproximada da animação
            setTimeout(() => {
                setEstado('aberta');
                // Espera um pouco após mostrar o prêmio para chamar onComplete
                setTimeout(() => onComplete?.(), 1500);
            }, 2000); // Ajuste esse tempo para corresponder à duração da sua animação
        } else {
            // Fallback se a animação falhar
            setTimeout(() => {
                setEstado('aberta');
                setTimeout(() => onComplete?.(), 1500);
            }, 2000);
        }
    };

    if (loading) {
        return (
            <Box sx={{
                width,
                height,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2
            }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography>Carregando animação...</Typography>
            </Box>
        );
    }

    // Se não temos animação, mostramos uma caixa simples
    if (!animationData) {
        return (
            <Box
                sx={{
                    position: 'relative',
                    width,
                    height,
                    margin: 'auto',
                    cursor: 'pointer',
                    userSelect: 'none',
                    bgcolor: '#ff5252',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px dashed #ffeb3b',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.3s ease',
                    }
                }}
                onClick={handleClick}
            >
                <Typography variant="h6" fontWeight="bold" color="#fff">
                    🎁 Clique para abrir
                </Typography>
            </Box>
        );
    }

    return (
        <>

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
                {/* Container da animação Lottie */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: estado === 'aberta' ? 'none' : 'block',
                        '&:hover': estado === 'fechada' ? {
                            transform: 'scale(1.05)',
                            transition: 'transform 0.3s ease',
                        } : {},
                        bgcolor: animationData ? 'transparent' : '#ff5252',
                        borderRadius: 2,
                        border: animationData ? 'none' : '4px dashed #ffeb3b',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {animationData ? (
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={animationData}
                            loop={false}
                            autoplay={false}
                            style={{ width: '100%', height: '100%' }}
                            onComplete={() => {
                                // Este callback será executado quando a animação terminar
                                if (estado === 'abrindo') {
                                    setEstado('aberta');
                                    // Espera um pouco após mostrar o prêmio para chamar onComplete
                                    setTimeout(() => onComplete?.(), 1500);
                                }
                            }}
                        />
                    ) : (
                        <Typography variant="h6" fontWeight="bold" color="#fff">
                            🎁 Clique para abrir
                        </Typography>
                    )}
                </Box>
                {/* Prêmio (visível apenas quando a caixa está aberta) */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: estado === 'aberta' ? 'flex' : 'none',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Imagem do prêmio com animação */}
                    <Box
                        sx={{
                            position: 'relative',
                            width: width * 0.7,
                            height: height * 0.6,
                            mb: 2,
                            animation: `${bounce} 0.7s ease forwards`,
                        }}
                    >
                        <Image
                            src={premioImagem}
                            alt={premioNome}
                            fill
                            sizes={`${Math.round(width * 0.7)}px`}
                            onLoadingComplete={() => setPremioCarregado(true)}
                            style={{ objectFit: 'contain' }}
                        />
                    </Box>

                    {/* Nome do prêmio com animação */}
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{
                            color: '#FFD700',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                            animation: `${fadeIn} 0.7s ease forwards`,
                            animationDelay: '0.3s',
                            opacity: 0,
                        }}
                    >
                        {premioNome}
                    </Typography>

                    {/* Confetes ou decoração adicional */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: -1,
                            pointerEvents: 'none',
                            background: 'url(/confetti.png)', // Opcional: adicione uma imagem de confete
                            backgroundSize: 'cover',
                            opacity: 0.5,
                        }}
                    />
                </Box>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    top: -40,
                    right: 0,
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => setDebugMode(!debugMode)}
                    style={{
                        background: debugMode ? '#ff5252' : '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    {debugMode ? 'Desativar Debug' : 'Debug'}
                </button>
            </Box>

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
                {/* Resto do código... */}
            </Box>

            {/* Controles de Debug - visíveis apenas no modo de depuração */}
            {debugMode && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -220,
                        left: 0,
                        width: '100%',
                        bgcolor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        p: 2,
                        borderRadius: 2,
                        zIndex: 1000,
                    }}
                >
                    <Typography variant="subtitle2" gutterBottom>
                        Ferramenta de Ajuste de Frames (Total: {totalFrames})
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: '80px' }}>
                            Frame inicial:
                        </Typography>
                        <input
                            type="range"
                            min="0"
                            max={totalFrames}
                            value={frameRange.start}
                            onChange={(e) => {
                                const newStart = parseInt(e.target.value);
                                if (newStart < frameRange.end) {
                                    setFrameRange(prev => ({ ...prev, start: newStart }));
                                }
                            }}
                            style={{ flex: 1, mr: 1 }}
                        />
                        <Typography variant="caption" sx={{ minWidth: '30px' }}>
                            {frameRange.start}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: '80px' }}>
                            Frame final:
                        </Typography>
                        <input
                            type="range"
                            min="0"
                            max={totalFrames}
                            value={frameRange.end}
                            onChange={(e) => {
                                const newEnd = parseInt(e.target.value);
                                if (newEnd > frameRange.start) {
                                    setFrameRange(prev => ({ ...prev, end: newEnd }));
                                }
                            }}
                            style={{ flex: 1, mr: 1 }}
                        />
                        <Typography variant="caption" sx={{ minWidth: '30px' }}>
                            {frameRange.end}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: '80px' }}>
                            Intervalo (ms):
                        </Typography>
                        <input
                            type="range"
                            min="500"
                            max="5000"
                            step="100"
                            value={intervalTime}
                            onChange={(e) => setIntervalTime(parseInt(e.target.value))}
                            style={{ flex: 1, mr: 1 }}
                        />
                        <Typography variant="caption" sx={{ minWidth: '30px' }}>
                            {intervalTime}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <button onClick={() => testarFrames(frameRange.start, frameRange.end)}>
                            Testar Seleção
                        </button>
                        <button onClick={() => iniciarAnimacaoCaixaMexendo()}>
                            Reiniciar Intervalo
                        </button>
                        <button onClick={() => setDebugMode(false)}>
                            Fechar
                        </button>
                    </Box>
                </Box>
            )}
        </>
    );
}