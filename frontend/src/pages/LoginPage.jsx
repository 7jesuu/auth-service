import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Fade,
} from "@mui/material";
import styles from "./LoginPage.module.css";
import GoogleIcon from "@mui/icons-material/Google";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1000);
      } else {
        setError(data.message || "Ошибка входа");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.root}>
      <Fade in timeout={800}>
        <Paper elevation={12} className={styles.paper}>
          <Typography
            variant="h4"
            fontWeight={700}
            mb={2}
            align="center"
            color="primary"
          >
            Вход
          </Typography>
          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              className={styles.button}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={26} color="inherit" />
              ) : (
                "Войти"
              )}
            </Button>
            {error && (
              <Typography color="error" align="center" mt={1}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" align="center" mt={1}>
                Успешный вход!
              </Typography>
            )}
          </Box>
          <Box
            mt={2}
            mb={1}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Typography variant="body2" color="textSecondary" mb={1}>
              или
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => {
                window.location.href = "http://localhost:3000/auth/google";
              }}
              sx={{ borderRadius: 2, fontWeight: 600, minWidth: 220 }}
            >
              Войти через Google
            </Button>
          </Box>
          <Typography align="center" mt={2}>
            Нет аккаунта?{" "}
            <a href="/register" className={styles.link}>
              Зарегистрироваться
            </a>
          </Typography>
        </Paper>
      </Fade>
    </Box>
  );
};

export default LoginPage;
