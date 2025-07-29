/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { formatPhone } from '@/utils/formatPhone';

type Props = {
  campanhaId: string;
  onCodigoGerado?: (codigo: string) => void;
};

export default function EnviarCodigoManual({ campanhaId, onCodigoGerado }: Props) {
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const user = getAuth().currentUser;

  const validatePhone = (value: string): boolean => {
    const onlyDigits = value.replace(/\D/g, '');
    return /^[0-9]{10,11}$/.test(onlyDigits);
  };

  const gerarCodigo = async () => {
    const rawPhone = telefone.replace(/\D/g, '');

    if (!validatePhone(telefone)) {
      toast.error('Por favor, informe um número de telefone válido.');
      return;
    }
     setLoading(true);
    console.log('campanhaId', campanhaId)
    try {
      const posicoesSnap = await getDocs(
        query(
          collection(db, 'campanhas', campanhaId, 'posicoes'),
          where('usado', '==', false)
        )
      );
      if (posicoesSnap.empty) {
        toast.warning('Sem posições disponíveis para essa campanha.');
        return;
      }
      
      const posDoc = posicoesSnap.docs[0];
      const posData = posDoc.data();
      const posId = posDoc.id;

      const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
     
      const codigoRef = await addDoc(collection(db, 'codigos'), {
        codigo: novoCodigo,
        campanhaId,
        telefone: rawPhone,
        userId: user?.uid,
        posicao: posId,
        criadoEm: Timestamp.now(),
        status: 'ativo',
        usado: false,
        premiado: posData.prize || 'nenhum',
      });

      await updateDoc(
        doc(db, 'campanhas', campanhaId, 'posicoes', posId),
        { usado: true }
      );
      if (onCodigoGerado) {
        onCodigoGerado(codigoRef.id); // envia o ID do código
      }
      toast.success(`Código gerado: ${novoCodigo}`);
      navigator.clipboard.writeText(novoCodigo);

      const siteLink = `${window.location.origin}/sorteio`;
      const message = `Parabéns! Você ganhou uma ficha para jogar no *Pedidos da Sorte*! 🎉\n\nSeu código é *${novoCodigo}*\nAcesse: ${siteLink}`;
      const whatsappURL = `https://api.whatsapp.com/send?phone=55${rawPhone}&text=${encodeURIComponent(message)}`;

      window.open(whatsappURL, '_blank');

      if (onCodigoGerado) onCodigoGerado(novoCodigo);
    } catch (err: any) {
      toast.error('Erro ao gerar código: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card
      sx={{
        borderRadius: 2,
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          component="h2"
          align="center"
          fontWeight="bold"
          gutterBottom
        >
          Envio Manual de Código
        </Typography>

        <TextField
          fullWidth
          placeholder="(44) 91234-5678"
          value={telefone}
          onChange={(e) => setTelefone(formatPhone(e.target.value))}
          sx={{ mb: 2 }}
          inputProps={{ style: { textAlign: 'center' } }}
        />

        <Button
          fullWidth
          disabled={loading}
          onClick={gerarCodigo}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#c70000' },
          }}
        >
          {loading ? 'Enviando…' : 'Enviar via WhatsApp'}
        </Button>
      </CardContent>
    </Card>
  );
}
