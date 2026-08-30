import { createContext, useContext, useState, ReactNode } from "react";

type ThemeMode = "light" | "dark";

type ThemeColors = {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
};

const lightColors: ThemeColors = {
  background: "#fff",
  text: "#000",
  textSecondary: "#555",
  card: "#f0f0f0",
  border: "#ccc",
};

const darkColors: ThemeColors = {
  background: "#1c1b22",
  text: "#f2f1f6",
  textSecondary: "#a8a6b3",
  card: "#2a2933",
  border: "#3a3942",
};

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colors = mode === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
}