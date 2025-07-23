import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from "@mui/material";
import styles from "./AdminPage.module.css";
import DownloadIcon from "@mui/icons-material/Download";
import dayjs from "dayjs";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const roles = [
  { value: "user", label: "Пользователь" },
  { value: "admin", label: "Администратор" },
];

const AdminPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  // Users state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    is_email_confirmed: "",
    is_active: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // Dialogs
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [roleValue, setRoleValue] = useState("user");
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createLoading, setCreateLoading] = useState(false);

  // Логи
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({
    action: "",
    userId: "",
    email: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [logPage, setLogPage] = useState(0);
  const [logLimit, setLogLimit] = useState(15);
  const [logsTotal, setLogsTotal] = useState(0);
  const [detailsLog, setDetailsLog] = useState(null);

  // Аудит пользователя
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAuditLogs, setUserAuditLogs] = useState([]);
  const [userAuditLoading, setUserAuditLoading] = useState(false);
  const [userAuditOpen, setUserAuditOpen] = useState(false);

  // Онлайн-статусы
  const [onlineStatuses, setOnlineStatuses] = useState({});

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    let url = "http://localhost:3000/user/all-users?";

    // Добавляем параметры только если они не пустые
    if (filters.search && filters.search.trim()) {
      url += `search=${encodeURIComponent(filters.search.trim())}&`;
    }
    if (filters.role && filters.role.trim()) {
      url += `role=${encodeURIComponent(filters.role.trim())}&`;
    }
    if (filters.is_email_confirmed && filters.is_email_confirmed !== "") {
      url += `is_email_confirmed=${filters.is_email_confirmed}&`;
    }
    if (filters.is_active && filters.is_active !== "") {
      url += `is_active=${filters.is_active}&`;
    }

    console.log("Fetching users with URL:", url);

    try {
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      console.log("Users response:", data);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Получить онлайн-статусы
  const fetchOnlineStatuses = async () => {
    try {
      const res = await fetch("http://localhost:3000/user/online-status", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setOnlineStatuses(data.statuses || {});
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchOnlineStatuses();
    /* eslint-disable-next-line */
  }, [filters]);

  // Получить логи
  const fetchLogs = async () => {
    setLogsLoading(true);
    let url = `http://localhost:3000/user/logs?limit=${logLimit}&offset=${
      logPage * logLimit
    }`;

    // Добавляем параметры только если они не пустые
    Object.entries(logFilters).forEach(([k, v]) => {
      if (v && v.toString().trim()) {
        url += `&${k}=${encodeURIComponent(v.toString().trim())}`;
      }
    });

    console.log("Fetching logs with URL:", url);

    try {
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      console.log("Logs response:", data);
      setLogs(data.logs || []);
      setLogsTotal(
        data.logs && data.logs.length === logLimit
          ? (logPage + 2) * logLimit
          : (logPage + 1) * logLimit
      );
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 1) fetchLogs(); /* eslint-disable-next-line */
  }, [tab, logFilters, logPage, logLimit]);

  // Смена роли
  const handleRoleChange = async () => {
    if (!editUser) return;
    try {
      const res = await fetch("http://localhost:3000/user/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: editUser.email, role: roleValue }),
      });
      if (res.ok) {
        setSnackbar({
          open: true,
          message: "Роль обновлена",
          severity: "success",
        });
        setEditUser(null);
        fetchUsers();
      } else {
        setSnackbar({
          open: true,
          message: "Ошибка смены роли",
          severity: "error",
        });
      }
    } catch {
      setSnackbar({ open: true, message: "Ошибка сети", severity: "error" });
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetch("http://localhost:3000/user/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: deleteUser.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSnackbar({
          open: true,
          message: "Пользователь удалён",
          severity: "success",
        });
        setDeleteUser(null);
        fetchUsers();
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Ошибка удаления",
          severity: "error",
        });
      }
    } catch (e) {
      setSnackbar({ open: true, message: "Ошибка сети", severity: "error" });
    }
  };

  // Экспорт логов
  const handleExport = async (type) => {
    let url = `http://localhost:3000/user/logs/export/${type}?limit=1000`;
    Object.entries(logFilters).forEach(([k, v]) => {
      if (v && v.toString().trim()) {
        url += `&${k}=${encodeURIComponent(v.toString().trim())}`;
      }
    });
    console.log("Export URL:", url);
    window.open(url, "_blank");
  };

  // Активировать/деактивировать пользователя
  const handleUserActiveStatus = async (email, isActive) => {
    try {
      const res = await fetch(
        "http://localhost:3000/user/set-user-active-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, isActive }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSnackbar({
          open: true,
          message: data.message,
          severity: "success",
        });
        fetchUsers();
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Ошибка изменения статуса",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Ошибка сети", severity: "error" });
    }
  };

  // Получить аудит пользователя
  const fetchUserAudit = async (userId) => {
    setUserAuditLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/user/user-audit/${userId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setUserAuditLogs(data.logs || []);
      } else {
        setUserAuditLogs([]);
      }
    } catch (error) {
      setUserAuditLogs([]);
    } finally {
      setUserAuditLoading(false);
    }
  };

  // Открыть аудит пользователя
  const handleUserAudit = (user) => {
    setSelectedUser(user);
    setUserAuditOpen(true);
    fetchUserAudit(user.id);
  };

  // Добавить функцию разлогинивания пользователя
  const handleLogoutUser = async (userId) => {
    try {
      const res = await fetch("http://localhost:3000/user/admin/logout-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({
          open: true,
          message: "Пользователь разлогинен на всех устройствах",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Ошибка разлогинивания",
          severity: "error",
        });
      }
    } catch {
      setSnackbar({ open: true, message: "Ошибка сети", severity: "error" });
    }
  };

  return (
    <Box className={styles.root}>
      <Box sx={{ position: "absolute", top: 32, left: 48, zIndex: 10 }}>
        <Button
          variant="outlined"
          color="primary"
          sx={{ borderRadius: 2, fontWeight: 600 }}
          onClick={() => navigate("/profile")}
        >
          В профиль
        </Button>
      </Box>
      <Paper className={styles.card} elevation={12}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          className={styles.tabs}
          centered
        >
          <Tab label="Пользователи" />
          <Tab label="Логи" />
        </Tabs>
        {tab === 0 && (
          <>
            <Box className={styles.header}>
              <Typography variant="h5" fontWeight={700} color="primary">
                Пользователи
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ borderRadius: 2, fontWeight: 600, minWidth: 180 }}
                onClick={() => setCreateOpen(true)}
              >
                Создать пользователя
              </Button>
              <Box className={styles.filters}>
                <TextField
                  label="Поиск по email"
                  size="small"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Роль</InputLabel>
                  <Select
                    label="Роль"
                    value={filters.role}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    <MenuItem value="">Все</MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Подтверждён</InputLabel>
                  <Select
                    label="Подтверждён"
                    value={filters.is_email_confirmed}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        is_email_confirmed: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">Все</MenuItem>
                    <MenuItem value="true">Да</MenuItem>
                    <MenuItem value="false">Нет</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Активен</InputLabel>
                  <Select
                    label="Активен"
                    value={filters.is_active}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        is_active: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">Все</MenuItem>
                    <MenuItem value="true">Да</MenuItem>
                    <MenuItem value="false">Нет</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            {loading ? (
              <CircularProgress sx={{ my: 4 }} />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Email
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Роль
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Подтверждён
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Активен
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Онлайн
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr
                        key={u.id}
                        style={{
                          background:
                            theme.palette.mode === "dark"
                              ? idx % 2 === 0
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.08)"
                              : idx % 2 === 0
                              ? "#f6f8fc"
                              : "#fff",
                          color: theme.palette.text.primary,
                        }}
                      >
                        <td style={{ color: theme.palette.text.primary }}>
                          {u.email}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {u.role}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {u.is_email_confirmed ? "Да" : "Нет"}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {u.is_active ? "Да" : "Нет"}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {onlineStatuses[u.id] ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                color: "#43a047",
                              }}
                            >
                              <FiberManualRecordIcon
                                sx={{ fontSize: 16, mr: 0.5 }}
                              />{" "}
                              Да
                            </span>
                          ) : (
                            <span style={{ color: "#bdbdbd" }}>
                              <FiberManualRecordIcon
                                sx={{ fontSize: 16, mr: 0.5 }}
                              />{" "}
                              Нет
                            </span>
                          )}
                        </td>
                        <td>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            className={styles.actionBtn}
                            onClick={() => {
                              setEditUser(u);
                              setRoleValue(u.role);
                            }}
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? theme.palette.primary.light
                                  : theme.palette.primary.main,
                              borderColor: theme.palette.primary.main,
                              "&:hover": {
                                background: theme.palette.action.hover,
                                borderColor: theme.palette.primary.dark,
                              },
                            }}
                          >
                            СМЕНИТЬ РОЛЬ
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color={u.is_active ? "warning" : "success"}
                            className={styles.actionBtn}
                            onClick={() =>
                              handleUserActiveStatus(u.email, !u.is_active)
                            }
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? u.is_active
                                    ? theme.palette.warning.light
                                    : theme.palette.success.light
                                  : u.is_active
                                  ? theme.palette.warning.main
                                  : theme.palette.success.main,
                              borderColor: u.is_active
                                ? theme.palette.warning.main
                                : theme.palette.success.main,
                              "&:hover": {
                                background: theme.palette.action.hover,
                                borderColor: u.is_active
                                  ? theme.palette.warning.dark
                                  : theme.palette.success.dark,
                              },
                            }}
                          >
                            {u.is_active ? "ДЕАКТИВИРОВАТЬ" : "АКТИВИРОВАТЬ"}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            className={styles.actionBtn}
                            onClick={() => handleUserAudit(u)}
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? theme.palette.info.light
                                  : theme.palette.info.main,
                              borderColor: theme.palette.info.main,
                              "&:hover": {
                                background: theme.palette.action.hover,
                                borderColor: theme.palette.info.dark,
                              },
                            }}
                          >
                            АУДИТ
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            className={styles.actionBtn}
                            onClick={() => setDeleteUser(u)}
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? theme.palette.error.light
                                  : theme.palette.error.main,
                              borderColor: theme.palette.error.main,
                              "&:hover": {
                                background: theme.palette.action.hover,
                                borderColor: theme.palette.error.dark,
                              },
                            }}
                          >
                            УДАЛИТЬ
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            className={styles.actionBtn}
                            onClick={() => handleLogoutUser(u.id)}
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? theme.palette.secondary.light
                                  : theme.palette.secondary.main,
                              borderColor: theme.palette.secondary.main,
                              "&:hover": {
                                background: theme.palette.action.hover,
                                borderColor: theme.palette.secondary.dark,
                              },
                            }}
                          >
                            РАЗЛОГИНИТЬ
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <Typography align="center">Нет пользователей</Typography>
                )}
              </Box>
            )}
          </>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary" mb={2}>
              Логи
            </Typography>
            <Box className={styles.filters}>
              <TextField
                label="Поиск по деталям"
                size="small"
                value={logFilters.search}
                onChange={(e) =>
                  setLogFilters((f) => ({ ...f, search: e.target.value }))
                }
                placeholder="Поиск в деталях логов"
              />
              <TextField
                label="User ID"
                size="small"
                value={logFilters.userId}
                onChange={(e) =>
                  setLogFilters((f) => ({ ...f, userId: e.target.value }))
                }
                type="number"
                sx={{ maxWidth: 120 }}
              />
              <TextField
                label="Email"
                size="small"
                value={logFilters.email}
                onChange={(e) =>
                  setLogFilters((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="Поиск по email"
                sx={{ maxWidth: 180 }}
              />
              <TextField
                label="Action"
                size="small"
                value={logFilters.action}
                onChange={(e) =>
                  setLogFilters((f) => ({ ...f, action: e.target.value }))
                }
                placeholder="Поиск по действию"
                sx={{ maxWidth: 140 }}
              />
              <TextField
                label="Дата с"
                size="small"
                type="date"
                value={logFilters.dateFrom}
                onChange={(e) =>
                  setLogFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: 140 }}
              />
              <TextField
                label="Дата по"
                size="small"
                type="date"
                value={logFilters.dateTo}
                onChange={(e) =>
                  setLogFilters((f) => ({ ...f, dateTo: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: 140 }}
              />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport("csv")}
                sx={{ minWidth: 40 }}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport("xlsx")}
                sx={{ minWidth: 40 }}
              >
                XLSX
              </Button>
            </Box>
            {logsLoading ? (
              <CircularProgress sx={{ my: 4 }} />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        ID
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        User ID
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Email
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Action
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Details
                      </th>
                      <th
                        style={{
                          background: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                        }}
                      >
                        Дата
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr
                        key={log.id}
                        style={{
                          background:
                            theme.palette.mode === "dark"
                              ? idx % 2 === 0
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.08)"
                              : idx % 2 === 0
                              ? "#f6f8fc"
                              : "#fff",
                          color: theme.palette.text.primary,
                        }}
                      >
                        <td style={{ color: theme.palette.text.primary }}>
                          {log.id}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {log.user_id}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {log.email}
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {log.action}
                        </td>
                        <td
                          style={{
                            maxWidth: 220,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: 13,
                          }}
                        >
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setDetailsLog(log)}
                          >
                            Подробнее
                          </Button>
                        </td>
                        <td style={{ color: theme.palette.text.primary }}>
                          {dayjs(log.created_at).format("YYYY-MM-DD HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && (
                  <Typography align="center">Нет логов</Typography>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={logPage === 0}
                    onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                  >
                    Назад
                  </Button>
                  <Typography sx={{ alignSelf: "center" }}>
                    Стр. {logPage + 1}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={logs.length < logLimit}
                    onClick={() => setLogPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                  <TextField
                    select
                    size="small"
                    label="На стр."
                    value={logLimit}
                    onChange={(e) => {
                      setLogLimit(Number(e.target.value));
                      setLogPage(0);
                    }}
                    sx={{ width: 90 }}
                  >
                    {[10, 15, 25, 50].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      {/* Диалог смены роли */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle
          sx={{
            color: theme.palette.text.primary,
            background: theme.palette.background.paper,
          }}
        >
          Сменить роль
        </DialogTitle>
        <DialogContent sx={{ background: theme.palette.background.paper }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              label="Роль"
              value={roleValue}
              onChange={(e) => setRoleValue(e.target.value)}
              sx={{ color: theme.palette.text.primary }}
            >
              {roles.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ background: theme.palette.background.paper }}>
          <Button onClick={() => setEditUser(null)}>Отмена</Button>
          <Button variant="contained" onClick={handleRoleChange}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      {/* Диалог удаления пользователя */}
      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)}>
        <DialogTitle
          sx={{
            color: theme.palette.text.primary,
            background: theme.palette.background.paper,
          }}
        >
          Удалить пользователя?
        </DialogTitle>
        <DialogContent sx={{ background: theme.palette.background.paper }}>
          <Typography>
            Вы уверены, что хотите удалить пользователя{" "}
            <b>{deleteUser?.email}</b>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ background: theme.palette.background.paper }}>
          <Button onClick={() => setDeleteUser(null)}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      {/* Модальное окно создания пользователя */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Создать пользователя</DialogTitle>
        <DialogContent>
          <TextField
            label="Email"
            type="email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
          />
          <TextField
            label="Пароль"
            type="password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ minLength: 6 }}
            helperText="Минимум 6 символов"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Роль</InputLabel>
            <Select
              label="Роль"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value)}
            >
              <MenuItem value="user">Пользователь</MenuItem>
              <MenuItem value="admin">Админ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setCreateLoading(true);
              try {
                const res = await fetch("http://localhost:3000/auth/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    email: createEmail,
                    password: createPassword,
                    role: createRole,
                  }),
                });
                const data = await res.json();
                if (res.ok) {
                  setSnackbar({
                    open: true,
                    message: "Пользователь создан",
                    severity: "success",
                  });
                  setCreateOpen(false);
                  setCreateEmail("");
                  setCreatePassword("");
                  setCreateRole("user");
                  fetchUsers();
                } else {
                  setSnackbar({
                    open: true,
                    message: data.message || "Ошибка создания",
                    severity: "error",
                  });
                }
              } catch {
                setSnackbar({
                  open: true,
                  message: "Ошибка сети",
                  severity: "error",
                });
              } finally {
                setCreateLoading(false);
              }
            }}
            disabled={
              createLoading ||
              !createEmail ||
              !createPassword ||
              createPassword.length < 6
            }
          >
            {createLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Создать"
            )}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Модальное окно подробностей лога */}
      <Dialog
        open={!!detailsLog}
        onClose={() => setDetailsLog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            color: theme.palette.text.primary,
            background: theme.palette.background.paper,
          }}
        >
          Детали лога
        </DialogTitle>
        <DialogContent sx={{ background: theme.palette.background.paper }}>
          {detailsLog && (
            <>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Action: <b>{detailsLog.action}</b>
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                User ID: <b>{detailsLog.user_id}</b> | Email:{" "}
                <b>{detailsLog.email}</b>
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Дата:{" "}
                <b>
                  {dayjs(detailsLog.created_at).format("YYYY-MM-DD HH:mm:ss")}
                </b>
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Details:
              </Typography>
              <Box
                sx={{
                  background:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "#f6f8fc",
                  borderRadius: 2,
                  p: 2,
                  fontSize: 14,
                  fontFamily: "monospace",
                  overflowX: "auto",
                  color: theme.palette.text.primary,
                }}
              >
                {(() => {
                  try {
                    const obj = JSON.parse(detailsLog.details);
                    return (
                      <pre style={{ margin: 0 }}>
                        {JSON.stringify(obj, null, 2)}
                      </pre>
                    );
                  } catch {
                    return <span>{detailsLog.details}</span>;
                  }
                })()}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ background: theme.palette.background.paper }}>
          <Button onClick={() => setDetailsLog(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      {/* Модальное окно аудита пользователя */}
      <Dialog
        open={userAuditOpen}
        onClose={() => setUserAuditOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            color: theme.palette.text.primary,
            background: theme.palette.background.paper,
          }}
        >
          Аудит пользователя: {selectedUser?.email}
        </DialogTitle>
        <DialogContent sx={{ background: theme.palette.background.paper }}>
          {userAuditLoading ? (
            <CircularProgress sx={{ my: 4 }} />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th
                      style={{
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                      }}
                    >
                      Action
                    </th>
                    <th
                      style={{
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                      }}
                    >
                      Details
                    </th>
                    <th
                      style={{
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                      }}
                    >
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userAuditLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      style={{
                        background:
                          theme.palette.mode === "dark"
                            ? idx % 2 === 0
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(255,255,255,0.08)"
                            : idx % 2 === 0
                            ? "#f6f8fc"
                            : "#fff",
                        color: theme.palette.text.primary,
                      }}
                    >
                      <td style={{ color: theme.palette.text.primary }}>
                        {log.id}
                      </td>
                      <td style={{ color: theme.palette.text.primary }}>
                        {log.action}
                      </td>
                      <td
                        style={{
                          maxWidth: 300,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          fontSize: 13,
                        }}
                      >
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setDetailsLog(log)}
                        >
                          Подробнее
                        </Button>
                      </td>
                      <td style={{ color: theme.palette.text.primary }}>
                        {dayjs(log.created_at).format("YYYY-MM-DD HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userAuditLogs.length === 0 && (
                <Typography align="center">
                  Нет логов для этого пользователя
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ background: theme.palette.background.paper }}>
          <Button onClick={() => setUserAuditOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage;
