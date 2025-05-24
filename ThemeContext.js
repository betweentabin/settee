import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  const colors = {
    dark: {
      primary: '#6200EE',
      secondary: '#03DAC6',
      accent: '#FF4081',
      background: '#121212',
      card: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      border: '#2C2C2C',
      notification: '#FF4081',
      error: '#CF6679',
      success: '#4CAF50',
    },
    light: {
      primary: '#6200EE',
      secondary: '#03DAC6',
      accent: '#FF4081',
      background: '#FFFFFF',
      card: '#F5F5F5',
      text: '#000000',
      textSecondary: '#757575',
      border: '#E0E0E0',
      notification: '#FF4081',
      error: '#B00020',
      success: '#4CAF50',
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: colors[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
