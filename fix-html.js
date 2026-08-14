import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

// Add manifest to HTML if not present properly (it was added in a previous step, but let's ensure it's clean)
html = html.replace(
  '<link rel="manifest" href="/manifest.json" />',
  ''
); // remove old if exists
html = html.replace(
  '<meta name="theme-color" content="#0d9488" />',
  ''
); // remove old if exists

const headAddition = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="apple-touch-icon" href="/icon-192.svg" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="MediBrid" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
          }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
        });
      }
    </script>
`;

html = html.replace('</head>', headAddition + '</head>');
fs.writeFileSync('index.html', html);
