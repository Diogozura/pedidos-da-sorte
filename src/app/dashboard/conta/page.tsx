'use client';

import { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent } from "@mui/material";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import DashboardCard from "@/components/DashboardCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from 'firebase/auth';

interface Usuario {
  uid: string;
  nome: string;
  email: string;
}

export default function GerenciarConta() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const router = useRouter();

  useEffect(() => {
  const fetchUsuarios = async () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData) return;

      // Se for admin, busca todos
      if (userData.nivel === 'admin') {
        const querySnapshot = await getDocs(collection(db, 'usuarios'));
        const lista: Usuario[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          lista.push({
            uid: doc.id,
            nome: data.nome || '',
            email: data.email || '',
          });
        });

        setUsuarios(lista);
      } else {
        // Se não for admin, mostra apenas os dados do próprio usuário
        setUsuarios([{
          uid: user.uid,
          nome: userData.nome,
          email: userData.email
        }]);
      }
    });
  };

  fetchUsuarios();
}, []);



  return (
    <ProtectedRoute>
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciar Conta
        </Typography>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid  size={{xs:12, md:4}}>
            <DashboardCard
              title="🎯 Raspadinhas Ativas"
              description="Visualize e gerencie todas as raspadinhas disponíveis no momento."
              onClick={() => router.push('/dashboard/empresa')}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Contas cadastradas
        </Typography>

        <Grid container spacing={2}>
          {usuarios.map((usuario) => (
            <Grid size={{xs:12, md:4}} key={usuario.uid}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {usuario.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {usuario.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </ProtectedRoute>
  );
}
