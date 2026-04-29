import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  LogOut, 
  Bell,
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users as UsersIcon,
  BarChart3
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from '../lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout, isManager, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const filteredNavItems = React.useMemo(() => {
    const items = [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Leads', icon: Target, path: '/leads' },
    ];

    if (isAdmin) {
      items.push({ name: 'Users', icon: UsersIcon, path: '/users' });
    }

    return items;
  }, [isManager, isAdmin]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-[#E6EAF0] dark:border-slate-800 bg-white dark:bg-[#1e293b] z-20",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          <div className={cn("h-16 flex items-center px-6 border-b border-[#E6EAF0] dark:border-slate-800 transition-all", isCollapsed ? "justify-center" : "justify-between")}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0 shadow-sm">
                <Target className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-[13px] font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-none uppercase">AV CORPORATION</span>
                  <span className="text-[9px] font-bold text-[#64748B] mt-1 uppercase tracking-[0.15em]">CRM SYSTEM</span>
                </div>
              )}
            </div>
          </div>
          
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-x-hidden">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "text-[#4F46E5] bg-[#4F46E5]/10 font-bold" 
                      : "text-[#64748B] hover:bg-[#F6F8FB] dark:hover:bg-slate-800/50 hover:text-[#0F172A] dark:hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200",
                    isActive ? "text-[#4F46E5]" : "text-[#94A3B8] group-hover:text-[#64748B] dark:group-hover:text-slate-300"
                  )} />
                  {!isCollapsed && <span className="text-[13px] tracking-tight">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className={cn("p-4 border-t border-[#E6EAF0] dark:border-slate-800 transition-all", isCollapsed ? "items-center" : "")}>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 w-full justify-start text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-200 h-9 rounded-lg px-2 group"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <><ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> <span className="text-xs font-bold">Collapse</span></>}
            </Button>
            
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-all",
              !isCollapsed ? "bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#E6EAF0] dark:border-slate-800 shadow-sm" : "justify-center"
            )}>
              <div className="relative shrink-0">
                <Avatar className="w-9 h-9 border-2 border-white dark:border-slate-700 shadow-sm">
                  <AvatarImage src={profile?.photoUrl} />
                  <AvatarFallback className="bg-[#4F46E5] text-white font-bold text-xs uppercase">
                    {profile?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate text-[#0F172A] dark:text-white leading-tight capitalize">{profile?.name}</p>
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5">{profile?.role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F6F8FB] dark:bg-[#0f172a]">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1e293b] border-b border-[#E6EAF0] dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm sticky top-0">
          <div className="flex items-center gap-8 flex-1">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5 dark:text-slate-400" />
                </Button>
              } />
              <SheetContent side="left" className="p-0 w-64 border-none">
                <div className="flex flex-col h-full bg-white dark:bg-[#1e293b] text-[#0F172A] dark:text-white">
                  <div className="h-16 flex items-center px-6 border-b border-[#E6EAF0] dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                       <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[15px] font-black tracking-tight">AV CORPORATION</span>
                    </div>
                  </div>
                  
                  <nav className="flex-1 px-4 py-6 space-y-1">
                    {filteredNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                          location.pathname === item.path 
                            ? "bg-[#4F46E5]/10 text-[#4F46E5]" 
                            : "text-[#64748B] hover:bg-[#F6F8FB] dark:hover:bg-slate-800/50 hover:text-[#0F172A] dark:hover:text-white"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-[#4F46E5]" : "text-[#94A3B8] group-hover:text-[#64748B]")} />
                        <span className="font-semibold text-sm">{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="md:hidden text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {filteredNavItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 invisible sm:visible">
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="w-9 h-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              <Button variant="ghost" size="icon" className="relative w-9 h-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </Button>
            </div>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="flex items-center gap-2.5 p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all group">
                  <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-primary/50 transition-colors">
                    <AvatarImage src={profile?.photoUrl} />
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">{profile?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-none gap-0.5 text-left">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{(String(profile?.name || 'User')).split(' ')[0]}</span>
                    <span className="text-[9px] font-semibold text-slate-400 group-hover:text-slate-500 uppercase tracking-wider">{profile?.role}</span>
                  </div>
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-200">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-slate-400 py-3 px-3">Session Profile</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg h-10 gap-3 px-3 font-semibold text-sm">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg h-10 gap-3 px-3 font-semibold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <LogOut className="h-4 w-4" />
                    Terminate Session
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-[1720px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
