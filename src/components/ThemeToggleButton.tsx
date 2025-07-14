'use client';

import { IconButton } from '@mui/material';
import { useThemeContext } from '@/theme/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggleButton() {
  const { toggleColorMode, mode } = useThemeContext();

  return (
    <IconButton onClick={toggleColorMode} color="inherit">
      <FontAwesomeIcon icon={mode === 'dark' ? faSun : faMoon} />
    </IconButton>
  );
}
