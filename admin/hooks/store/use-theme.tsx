import { useContext } from "react";
// store
import { StoreContext } from "@/lib/app-providers";
import { IThemeStore } from "@/store/theme.store";

export const useTheme = (): IThemeStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTheme must be used within StoreProvider");
  return context.theme;
};
