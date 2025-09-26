import { createTheme } from "@rneui/themed";

export const theme = createTheme({
  lightColors: {
    primary: "#007bff",
    secondary: "#28a745",
    success: "#28a745",
    warning: "#ff9800",
    error: "#dc3545",
    background: "#f8f9fa",
    grey0: "#212529",
    grey1: "#495057",
    grey2: "#6c757d",
    grey3: "#adb5bd",
    grey4: "#ced4da",
    grey5: "#e9ecef",
  },
  darkColors: {
    primary: "#007bff",
    secondary: "#28a745",
    success: "#28a745",
    warning: "#ff9800",
    error: "#dc3545",
    background: "#1a1a1a",
    grey0: "#ffffff",
    grey1: "#f8f9fa",
    grey2: "#e9ecef",
    grey3: "#adb5bd",
    grey4: "#6c757d",
    grey5: "#495057",
  },
  mode: 'light',
});
