// src/app/page.tsx
'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('rrhh@agetic.gob.bo');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        const msg =
            data?.message ??
            (res.status === 401
                ? 'Credenciales inválidas.'
                : 'Error al iniciar sesión.');
        throw new Error(msg);
      }

      // data = { access_token, usuario }
      window.localStorage.setItem('token', data.access_token as string);
      window.localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // 👉 Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
      <Container
          maxWidth="sm"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
          }}
      >
        <Card sx={{ width: '100%', boxShadow: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              RRHH AGETIC
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                mb={3}
            >
              Inicia sesión con tu correo institucional
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                  label="Correo electrónico"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                  label="Contraseña"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />

              <Box
                  mt={3}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
              >
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    fullWidth
                    size="large"
                    sx={{ py: 1.2 }}
                >
                  {loading ? (
                      <CircularProgress size={24} color="inherit" />
                  ) : (
                      'Iniciar sesión'
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
  );
}