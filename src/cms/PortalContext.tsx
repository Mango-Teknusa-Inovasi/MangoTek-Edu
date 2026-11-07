import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { PortalContent } from "./schema";
const Context = createContext<PortalContent | null>(null);
export const usePortal = () => {
  const value = useContext(Context);
  if (!value) throw Error("PortalProvider is required.");
  return value;
};
export function useServiceHref() {
  const { sections } = usePortal();
  return sections.find((s) => s.id === "layanan")?.visible
    ? "#layanan"
    : sections.find((s) => s.id === "kontak")?.visible
      ? "#kontak"
      : "/berita";
}
export function PortalProvider({
  content,
  children,
}: {
  content: PortalContent;
  children: ReactNode;
}) {
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty("--green", content.theme.ink);
    s.setProperty("--ink", content.theme.ink);
    s.setProperty("--paper", content.theme.background);
    s.setProperty("--ink-dark", content.theme.ink);
    s.color = content.theme.ink;
    s.backgroundColor = content.theme.background;
    s.setProperty("--mango", content.theme.accent);
    return () => {
      for (const key of [
        "--green",
        "--ink",
        "--paper",
        "--ink-dark",
        "--mango",
      ])
        s.removeProperty(key);
    };
  }, [content.theme]);
  return <Context value={content}>{children}</Context>;
}
