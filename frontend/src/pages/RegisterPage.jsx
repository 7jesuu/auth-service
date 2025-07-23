import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Fade,
  CircularProgress,
} from "@mui/material";
import styles from "./RegisterPage.module.css";

const RegisterPage = () => {
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
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      } else {
        setError(data.message || "Ошибка регистрации");
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
            Регистрация
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
              inputProps={{ minLength: 6 }}
              helperText="Минимум 6 символов"
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
                "Зарегистрироваться"
              )}
            </Button>
            {error && (
              <Typography color="error" align="center" mt={1}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" align="center" mt={1}>
                Успешная регистрация! Перенаправление...
              </Typography>
            )}
          </Box>
          <Typography align="center" mt={2}>
            Уже есть аккаунт?{" "}
            <a href="/login" className={styles.link}>
              Войти
            </a>
          </Typography>
        </Paper>
      </Fade>
    </Box>
  );
};

export default RegisterPage;
