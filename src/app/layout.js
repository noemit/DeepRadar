import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";

export const metadata = {
  title: "DeepRadar - Personalized Industry Scans",
  description:
    "Daily industry scans that adapt to your role, domain, and evolving interests",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
