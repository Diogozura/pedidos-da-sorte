import { db } from "@/lib/firebase";
import { Button, Card, CardActions, CardContent, TextField, Typography } from "@mui/material";
import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";

// componente separado para a validação
export default  function ValidateVoucherPanel() {
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);

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
    <Card>
      <CardContent>
        <Typography variant="h6">Validar Voucher</Typography>
        <TextField
          label="Código do Voucher"
          fullWidth
          margin="normal"
          value={voucherCode}
          onChange={e => setVoucherCode(e.target.value)}
        />
      </CardContent>
      <CardActions>
        <Button variant="contained" onClick={handleValidate} disabled={loading}>
          {loading ? 'Validando…' : 'Validar'}
        </Button>
      </CardActions>
    </Card>
  );
}