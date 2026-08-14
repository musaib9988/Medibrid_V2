import fs from 'fs';
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  `          {/* Top Bar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                {MenuIcon ? <MenuIcon className="w-6 h-6" /> : <div className="w-6 h-6 border-y-2 border-slate-600 my-1" />}
              </button>
            <div className="flex items-center gap-4">`,
  `          {/* Top Bar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                {MenuIcon ? <MenuIcon className="w-6 h-6" /> : <div className="w-6 h-6 border-y-2 border-slate-600 my-1" />}
              </button>`
);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
