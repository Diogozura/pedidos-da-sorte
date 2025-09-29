import { db } from "@/lib/firebase";
import {
  Button, Card, CardActions, CardContent, TextField, Typography
} from "@mui/material";
import {
  Timestamp, collection, doc, getDocs, limit, query, runTransaction, where
} from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";

type VoucherDoc = {
  campanhaId?: string;
  codigoOriginal?: string;
  codigoVoucher: string;
  criadoEm?: Timestamp;
  status: "valido" | "usado" | "invalido" | "expirado" | string;
  usado?: boolean;
  usadoEm?: Timestamp;
};

export default function ValidateVoucherPanel() {
  const [voucherCode, setVoucherCode] = useState("");
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingRedeem, setLoadingRedeem] = useState(false);
  const [premioNome, setPremioNome] = useState<string | null>(null);
  const theme = useTheme();

  const normalize = (s: string) => s.trim().toUpperCase();

  async function getVoucherByCode(code: string) {
    const q = query(
      collection(db, "vouchers"),
      where("codigoVoucher", "==", normalize(code)),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, data: d.data() as VoucherDoc };
  }

  const handleCheck = async () => {
    if (!voucherCode.trim()) {
      toast.error("Informe o código do voucher");
      return;
    }
    setLoadingCheck(true);
    try {
      const found = await getVoucherByCode(voucherCode);
      if (!found) {
        toast.error("Voucher não encontrado");
        return;
      }
      const { data } = found;

      // tenta buscar o código original (na coleção 'codigos') para obter o nome do prêmio
      let localPrize: string | null = null;
      try {
        if (data.codigoOriginal) {
          const qCod = query(collection(db, 'codigos'), where('codigo', '==', data.codigoOriginal), limit(1));
          const snapCod = await getDocs(qCod);
          if (!snapCod.empty) {
            const d = snapCod.docs[0].data();
            console.log('handleCheck - codigos doc:', snapCod.docs[0].id, d);
            localPrize = d.premiado ?? null;
            setPremioNome(localPrize);
          } else {
            localPrize = null;
            setPremioNome(null);
          }
        } else {
          localPrize = null;
          setPremioNome(null);
        }
      } catch (err) {
        console.warn('Erro ao buscar prêmio relacionado:', err);
        localPrize = null;
        setPremioNome(null);
      }

      const jaUsado = data.status === "usado" || data.usado === true;
      if (jaUsado) {
        // use o valor local se disponível (setState é assíncrono)
        const prizeToShow = localPrize ?? premioNome;
        toast.warning(prizeToShow ? `Este voucher já foi resgatado. Prêmio: ${prizeToShow}` : "Este voucher já foi resgatado.");
      } else if (data.status === "valido" || data.usado === false || data.usado === undefined) {
        toast.info("Voucher válido e ainda não resgatado.");
      } else {
        toast.info(`Status atual: "${data.status}".`);
      }
    } catch (err) {
      toast.error("Erro ao verificar voucher");
      console.error(err);
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleRedeem = async () => {
    if (!voucherCode.trim()) {
      toast.error("Informe o código do voucher");
      return;
    }
    setLoadingRedeem(true);
    try {
      // transação garante que ninguém resgate duas vezes
      await runTransaction(db, async (tx) => {
        const found = await getVoucherByCode(voucherCode);
        if (!found) throw new Error("Voucher não encontrado");

        const ref = doc(db, "vouchers", found.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Voucher não encontrado");

        const data = snap.data() as VoucherDoc;

        const jaUsado = data.status === "usado" || data.usado === true;
        if (jaUsado) {
          // tenta enriquecer a mensagem com o nome do prêmio, se houver
          try {
            if (data.codigoOriginal) {
              const qCodUsed = query(collection(db, 'codigos'), where('codigo', '==', data.codigoOriginal), limit(1));
              const snapCodUsed = await getDocs(qCodUsed);
              if (!snapCodUsed.empty) {
                const dUsed = snapCodUsed.docs[0].data();
                // console.log('handleRedeem (jaUsado) - codigos doc:', snapCodUsed.docs[0].id);
                console.log('handleRedeem (jaUsado) - codigos doc:', dUsed.premiado);
                const prize = dUsed?.premiado;
                if (prize) {
                  throw new Error(`Voucher já foi resgatado. Prêmio: ${prize}`);
                }
              }
            }
          } catch (err) {
            console.warn('Erro ao buscar prêmio para voucher já usado:', err);
          }
          throw new Error("Voucher já foi resgatado.");
        }

        // se quiser, aqui dá pra validar expirado/invalido
        // if (data.status !== 'valido') throw new Error('Voucher inválido/expirado');

        tx.update(ref, {
          status: "usado",
          usado: true,
          usadoEm: Timestamp.now(),
        });
      });

      // após o commit, tenta obter o nome do prêmio (se disponível) e mostrar no toast
      try {
        const foundAfter = await getVoucherByCode(voucherCode);
        if (foundAfter && foundAfter.data.codigoOriginal) {
          const qCodAfter = query(collection(db, 'codigos'), where('codigo', '==', foundAfter.data.codigoOriginal), limit(1));
          const snapCodAfter = await getDocs(qCodAfter);
          if (!snapCodAfter.empty) {
            const d = snapCodAfter.docs[0].data();
            console.log('handleRedeem (after) - codigos doc:', snapCodAfter.docs[0].id, d);
            setPremioNome(d.premiado ?? null);
            toast.success(`Resgatado com sucesso! Prêmio: ${d.premiado}`);
          } else {
            toast.success('Resgatado com sucesso!');
          }
        } else {
          toast.success('Resgatado com sucesso!');
        }
      } catch (err) {
        console.warn('Erro ao buscar prêmio após resgate:', err);
        toast.success('Resgatado com sucesso!');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao resgatar";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoadingRedeem(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        height: "100%",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.text.secondary,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: 4,
      }}
    >
      <CardContent>
        <Typography component="h2" color="#fff" variant="h6" textAlign="center">
          Validação de Voucher
        </Typography>
        <TextField
          placeholder="Código do Voucher"
          fullWidth
          margin="normal"
          value={voucherCode}
          onChange={(e) => { setVoucherCode(e.target.value); setPremioNome(null); }}
          sx={{
            mb: 2,
            backgroundColor: "#ffffff",
            borderRadius: 1,
            input: { textAlign: "center" },
          }}
          InputProps={{ disableUnderline: true }}
          size="medium"
        />
        {premioNome && (
          <Typography variant="body2" color="#fff" textAlign="center" sx={{ mt: 1 }}>
            Prêmio: {premioNome}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ flexDirection: "column", gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleCheck}
          disabled={loadingCheck || loadingRedeem}
          sx={{ bgcolor: "black", color: "white", "&:hover": { bgcolor: "#222" } }}
          size="large"
        >
          {loadingCheck ? "Verificando…" : "Verificar"}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleRedeem}
          disabled={loadingCheck || loadingRedeem}
          sx={{ bgcolor: "white", color: "black", "&:hover": { bgcolor: "#f0f0f0" } }}
          size="large"
        >
          {loadingRedeem ? "Resgatando…" : "Resgatar"}
        </Button>
      </CardActions>
    </Card>
  );
}
