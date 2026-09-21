"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: { main: "#7257d6", dark: "#5740b2", light: "#eeeafd" },
    secondary: { main: "#e77f8b" },
    background: { default: "#f8f7fb", paper: "#ffffff" },
    text: { primary: "#292534", secondary: "#777281" },
  },
  typography: {
    fontFamily: '"Vazirmatn Variable", Vazirmatn, Tahoma, sans-serif',
    button: { fontWeight: 750, textTransform: "none" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: false } },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        switchBase: { "&.Mui-checked": { color: "#7257d6" }, "&.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7257d6", opacity: 1 } },
        track: { borderRadius: 20, backgroundColor: "#d8d5dc", opacity: 1 },
      },
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
