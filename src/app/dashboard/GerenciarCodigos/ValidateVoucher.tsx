import { db } from "@/lib/firebase";
import { Button, Card, CardActions, CardContent, TextField, Typography } from "@mui/material";
import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from '@mui/material/styles';

// componente separado para a validação
export default function ValidateVoucherPanel() {
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const handleValidate = async () => {
    if (!voucherCode) {
      toast.error('Informe o código do voucher');
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'vouchers'),
        where('codigoVoucher', '==', voucherCode.toUpperCase())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error('Voucher não encontrado');
      } else {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        if (data.status === 'valido') {
          // exemplo: atualizar status
          await updateDoc(doc(db, 'vouchers', docSnap.id), { status: 'usado', usadoEm: Timestamp.now() });
          toast.success('Voucher validado com sucesso!');
        } else {
          toast.warning(`Este voucher já está com status "${data.status}"`);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao validar voucher: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        height: '100%',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.text.secondary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <CardContent>
        <Typography component={'h2'} color="#fff" variant="h6" textAlign={'center'}>Validação de  Voucher</Typography>
        <TextField
          // label="Código do Voucher"
          placeholder="Código do Voucher"
          fullWidth
          margin="normal"
          value={voucherCode}
          onChange={e => setVoucherCode(e.target.value)}
          sx={{
            mb: 2,
            backgroundColor: '#ffffff',
            borderRadius: 1,
            input: { textAlign: 'center' }
          }}
          InputProps={{ disableUnderline: true }}
        />
      </CardContent>
      <CardActions sx={{ flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleValidate}
          disabled={loading}
          sx={{
            bgcolor: 'black',
            color: 'white',
            '&:hover': {
              bgcolor: '#222'
            }
          }}
        >
          {loading ? 'Validando…' : 'Verificar'}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleValidate}
          disabled={loading}
          sx={{
            bgcolor: 'white',
            color: 'black',
            '&:hover': {
              bgcolor: '#f0f0f0'
            }
          }}
        >
          {loading ? 'Resgatando…' : 'Resgatar'}
        </Button>
      </CardActions>
    </Card>
  );
}