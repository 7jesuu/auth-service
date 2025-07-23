import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
      <IconButton onClick={toggleTheme} color="primary" size="large" sx={{ ml: 1, transition: 'color 0.3s' }}>
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 