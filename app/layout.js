
export const metadata = {
  title: "Sam's FPL Command Centre",
  description:
    "Fantasy Premier League dashboard for team 4727294",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
