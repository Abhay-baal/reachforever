import "./globals.css";

export const metadata = {
  title: {
    default: "Reach Forever | Digital Marketing & Brand Growth",
    template: "%s | Reach Forever",
  },
  description:
    "Reach Forever is a full-service digital marketing agency helping brands build meaningful digital experiences, connect with the right people, and grow through genuine results.",
  applicationName: "Reach Forever",
  keywords: [
    "Reach Forever",
    "digital marketing agency",
    "brand strategy",
    "social media marketing",
    "performance marketing",
    "creative agency",
  ],
  openGraph: {
    title: "Reach Forever | Good brands deserve to go further.",
    description:
      "Strategy, creativity and measurable growth for brands ready to move forward.",
    siteName: "Reach Forever",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
