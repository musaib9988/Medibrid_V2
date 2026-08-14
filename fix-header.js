import fs from 'fs';
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

header = header.replace(
  '<div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">\n          M\n        </div>',
  '<img src="/icon.svg" alt="MediBrid Logo" className="w-8 h-8 rounded-full shadow-sm" />'
);
fs.writeFileSync('src/components/Header.tsx', header);
