import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Fade,
} from "@mui/material";
import styles from "./ProfilePage.module.css";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:3000/user/me", {
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setError("Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:3000/user/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  return (
    <Box className={styles.root}>
      <Fade in timeout={800}>
        <Paper className={styles.card} elevation={12}>
          <Typography
            variant="h4"
            fontWeight={700}
            mb={2}
            color="primary"
            align="center"
          >
            Профиль
          </Typography>
          {loading ? (
            <CircularProgress sx={{ my: 4 }} />
          ) : error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : user ? (
            <>
              <Box className={styles.info}>
                <Typography>
                  <span className={styles.label}>Email:</span>
                  <span className={styles.value}>{user.email}</span>
                </Typography>
                <Typography>
                  <span className={styles.label}>Роль:</span>
                  <span className={styles.value}>
                    {user.role_name === "admin" || user.role === "admin"
                      ? "Админ"
                      : user.role_name === "user" || user.role === "user"
                      ? "Пользователь"
                      : user.role_name || user.role || user.role_id}
                  </span>
                </Typography>
              </Box>
              {["admin", "Администратор"].includes(user.role_name) && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    mb: 2,
                    mt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                    onClick={() => navigate("/admin")}
                  >
                    Перейти в админ-панель
                  </Button>
                </Box>
              )}
              <Button
                variant="contained"
                color="error"
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
                Выйти
              </Button>
            </>
          ) : null}
        </Paper>
      </Fade>
    </Box>
  );
};

export default ProfilePage;
