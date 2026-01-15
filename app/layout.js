import './globals.css'

export const metadata = {
  title: 'Roof Inspection Report',
  description: 'Professional roof inspection report generator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
