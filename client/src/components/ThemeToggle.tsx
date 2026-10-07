import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log("Theme toggle clicked, current theme:", theme);
    if (toggleTheme) {
      toggleTheme();
    } else {
      console.error("toggleTheme is not available");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
      aria-label="Toggle dark mode"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--accent)",
        color: "var(--foreground)"
      }}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" style={{ color: "#2FA7A0" }} />
      ) : (
        <Moon className="h-5 w-5" style={{ color: "#2FA7A0" }} />
      )}
      <span className="text-sm font-semibold">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
