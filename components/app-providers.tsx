"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useEffect } from "react";

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

function BrowserActionGuard() {
  useEffect(() => {
    const isEditable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    const stopContextMenu = (event: MouseEvent) => { if (!isEditable(event.target)) event.preventDefault(); };
    const stopDrag = (event: DragEvent) => event.preventDefault();
    const stopGesture = (event: Event) => { if (!isEditable(event.target)) event.preventDefault(); };

    document.addEventListener("contextmenu", stopContextMenu);
    document.addEventListener("dragstart", stopDrag);
    document.addEventListener("gesturestart", stopGesture, { passive: false });
    return () => {
      document.removeEventListener("contextmenu", stopContextMenu);
      document.removeEventListener("dragstart", stopDrag);
      document.removeEventListener("gesturestart", stopGesture);
    };
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline /><BrowserActionGuard />{children}</ThemeProvider>;
}
