import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '<title>MediBrid — Your Health Partner</title>',
  `<title>MediBrid — Your Health Partner</title>
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0d9488" />
    <link rel="apple-touch-icon" href="/icon.svg" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
);
fs.writeFileSync('index.html', html);
