import "./globals.css";

export const metadata = {
  title: "PotluckShare",
  description:
    "PotluckShare is a lightweight, no-account potluck organizer that lets friend groups create an event, claim dishes, and keep a live, shared list through one simple link."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
