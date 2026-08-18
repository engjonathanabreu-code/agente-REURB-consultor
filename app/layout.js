import "./globals.css";

export const metadata = {
  title: "Agente IA REURB",
  description: "Assistente técnico de Regularização Fundiária Urbana"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
