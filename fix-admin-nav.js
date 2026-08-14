import fs from 'fs';
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  'interface NavItemProps {',
  `interface NavItemProps {
  onClickMenu?: () => void;`
);

code = code.replace(
  'const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, id, badge, activeTab, setActiveTab }) => {',
  'const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, id, badge, activeTab, setActiveTab, onClickMenu }) => {'
);

code = code.replace(
  'onClick={() => setActiveTab(id)}',
  'onClick={() => { setActiveTab(id); if(onClickMenu) onClickMenu(); }}'
);

code = code.replace(
  "const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');",
  `const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [MenuIcon, setMenuIcon] = useState(null);
  
  // Lazy load Menu icon to avoid import issues
  React.useEffect(() => {
    import('lucide-react').then(mod => setMenuIcon(() => mod.Menu));
  }, []);`
);

code = code.replace(
  '<div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto shadow-sm">',
  `{/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[200] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={\`fixed inset-y-0 left-0 z-[210] w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto shadow-sm transform transition-transform duration-300 lg:relative lg:translate-x-0 \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}\`}>`
);

code = code.replace(
  '          {/* Top Bar Header */}\n          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">',
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

// We need to add onClickMenu={() => setIsMobileMenuOpen(false)} to all NavItems
code = code.replace(/<NavItem /g, '<NavItem onClickMenu={() => setIsMobileMenuOpen(false)} ');

// Also make tables overflow-x-auto
code = code.replace(/<table/g, '<div className="overflow-x-auto"><table');
code = code.replace(/<\/table>/g, '</table></div>');

fs.writeFileSync('src/components/AdminPanel.tsx', code);
