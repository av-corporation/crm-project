import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, updateProfile, deleteUser, createUser } from '../services/crmService';
import { UserProfile, UserRole } from '../types/crm';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  Search,
  MoreVertical,
  Mail,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  Copy,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const inputCls =
  'h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 font-normal text-sm shadow-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

const labelCls = 'text-xs font-medium text-slate-600 dark:text-slate-300';

const UsersPage: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add user state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    username: string;
    mobile: string;
    role: UserRole;
    password: string;
  }>({
    name: '',
    email: '',
    username: '',
    mobile: '',
    role: 'sales',
    password: '',
  });

  // Share credentials modal
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);

  // Edit/delete state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getUsers().then((data) => {
        if (data) setUsers(data);
        setIsLoading(false);
      });
    }
  }, [isAdmin]);

  const handleCreateUser = async () => {
    const trimmedName = newUser.name.trim();
    const trimmedUsername = newUser.username.trim().toLowerCase();
    const trimmedEmail = newUser.email.trim().toLowerCase();
    const trimmedMobile = newUser.mobile.trim();
    const password = (newUser.password || '123456').trim();

    if (!trimmedName || !trimmedUsername) {
      toast.error('Name and Username are required');
      return;
    }

    setIsCreating(true);
    try {
      const uid = await createUser({
        name: trimmedName,
        email: trimmedEmail || undefined,
        username: trimmedUsername,
        mobile: trimmedMobile || undefined,
        role: newUser.role,
        password,
      });

      if (uid) {
        const created: UserProfile = {
          uid,
          name: trimmedName,
          email: trimmedEmail || undefined,
          username: trimmedUsername,
          mobile: trimmedMobile || undefined,
          role: newUser.role,
          password,
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, created]);
        setCreatedUser(created);
        setIsAddOpen(false);
        setIsShareOpen(true);
        setNewUser({ name: '', email: '', username: '', mobile: '', role: 'sales', password: '' });
        toast.success('User created successfully');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateProfile(editingUser.uid, {
        name: editingUser.name,
        email: editingUser.email,
        mobile: editingUser.mobile,
        role: editingUser.role,
      });
      setUsers((prev) => prev.map((u) => (u.uid === editingUser.uid ? editingUser : u)));
      setIsEditOpen(false);
      toast.success('User profile updated');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const confirmDelete = (u: UserProfile) => {
    if (u.uid === profile?.uid) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (u.role === 'admin' && u.isPrimary) {
      toast.error('Primary admin cannot be deleted');
      return;
    }
    setUserToDelete(u);
    setIsDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      setIsDeleteOpen(false);
      setUserToDelete(null);
      toast.success('User deleted');
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateShareMessage = (u: UserProfile) => {
    const loginUrl = `${window.location.origin}/login?username=${u.username}`;
    return `Hello ${u.name},

Your CRM account has been created.

Login Details:
Username: ${u.username}
Password: ${u.password || '123456'}

Login here:
${loginUrl}

Regards,
A V Corporation`;
  };

  const handleCopy = (u: UserProfile) => {
    navigator.clipboard.writeText(generateShareMessage(u));
    toast.success('Login details copied');
  };

  const handleWhatsApp = (u: UserProfile) => {
    if (!u.mobile) return;
    const msg = encodeURIComponent(generateShareMessage(u));
    window.open(`https://wa.me/${u.mobile}?text=${msg}`, '_blank');
  };

  const handleEmail = (u: UserProfile) => {
    const subject = encodeURIComponent('Your CRM Login Details');
    const body = encodeURIComponent(generateShareMessage(u));
    window.open(`mailto:${u.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const filteredUsers = (users || []).filter(
    (u) =>
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const RoleBadge = ({ role }: { role: string }) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return (
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-none hover:bg-rose-50">
            <ShieldAlert className="w-3 h-3" /> Admin
          </Badge>
        );
      case 'manager':
        return (
          <Badge className="bg-blue-50 text-blue-600 border border-blue-100 gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-none hover:bg-blue-50">
            <ShieldCheck className="w-3 h-3" /> Manager
          </Badge>
        );
      case 'sales':
        return (
          <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-none hover:bg-indigo-50">
            <User className="w-3 h-3" /> Sales
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium text-[11px] px-2.5 py-1 rounded-full border-slate-200 text-slate-600">
            {role}
          </Badge>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-2xl">
        <ShieldAlert className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="page-title">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-1">Administrator authorization required.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-8 pb-12"
    >
      {/* Page header — matches Dashboard */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage team members, roles, and access permissions.</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add new user
        </Button>
      </div>

      {/* Search + total */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users by name, username or email..."
              className={`pl-10 ${inputCls}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex items-center gap-2">
            <span className="text-xs text-slate-500">Total</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{users.length}</span>
          </div>
        </div>

        <CardContent className="p-5 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[140px] bg-white animate-pulse rounded-2xl border border-slate-100" />
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-16 text-sm text-slate-500">No users match your search.</div>
            ) : (
              filteredUsers.map((u) => (
                <motion.div
                  layout
                  key={u.uid}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3.5 min-w-0">
                      <Avatar className="w-12 h-12 rounded-xl border border-slate-100 shadow-sm shrink-0">
                        <AvatarImage src={u.photoUrl} className="object-cover" />
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold rounded-xl">
                          {u.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate tracking-tight">
                          {u.name}
                        </h4>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {u.email || `@${u.username}`}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100" />}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border-slate-200 shadow-lg bg-white">
                        <DropdownMenuItem
                          className="gap-2.5 font-medium text-sm py-2 rounded-lg"
                          onClick={() => {
                            setEditingUser(u);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2.5 font-medium text-sm py-2 rounded-lg"
                          onClick={() => handleCopy(u)}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy login details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                          className="gap-2.5 font-medium text-sm py-2 rounded-lg text-rose-600 focus:bg-rose-50"
                          onClick={() => confirmDelete(u)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <RoleBadge role={u.role || 'sales'} />
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        onClick={() => handleEmail(u)}
                        title="Email login details"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                      {u.mobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          onClick={() => handleWhatsApp(u)}
                          title="Send via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                  Add new user
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  Create credentials and assign a role.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelCls}>Full name *</Label>
                <Input
                  placeholder="John Doe"
                  className={inputCls}
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Username *</Label>
                <Input
                  placeholder="johndoe"
                  className={inputCls}
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelCls}>Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  className={inputCls}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Mobile (with country code)</Label>
                <Input
                  placeholder="919876543210"
                  className={inputCls}
                  value={newUser.mobile}
                  onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelCls}>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v: UserRole) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Password</Label>
                <Input
                  type="text"
                  placeholder="Default: 123456"
                  className={inputCls}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="h-11 flex-1 rounded-xl font-medium text-sm border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreating}
              className="h-11 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm"
            >
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Credentials Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-xl bg-white dark:bg-slate-900">
          <div className="p-6 text-center bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/20 dark:to-transparent border-b border-slate-100 dark:border-white/5">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              User created
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Share login credentials with the new user.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Username</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{createdUser?.username}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Password</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                  {createdUser?.password || '123456'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => createdUser && handleWhatsApp(createdUser)}
                disabled={!createdUser?.mobile}
                className="w-full h-11 bg-[#25D366] hover:bg-[#20ba59] text-white font-medium text-sm gap-2 rounded-xl shadow-sm disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                Send via WhatsApp
              </Button>
              <Button
                onClick={() => createdUser && handleCopy(createdUser)}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm gap-2 rounded-xl shadow-sm"
              >
                <Copy className="w-4 h-4" />
                Copy details
              </Button>
              <Button
                onClick={() => createdUser && handleEmail(createdUser)}
                variant="outline"
                className="w-full h-11 font-medium text-sm gap-2 rounded-xl border-slate-200"
              >
                <Mail className="w-4 h-4" />
                Send via email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                  Edit user
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  Update profile and access role.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {editingUser && (
              <>
                <div className="space-y-2">
                  <Label className={labelCls}>Full name</Label>
                  <Input
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className={inputCls}
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelCls}>Email</Label>
                    <Input
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className={inputCls}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelCls}>Mobile</Label>
                    <Input
                      value={editingUser.mobile || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                      className={inputCls}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(v: UserRole) => setEditingUser({ ...editingUser, role: v })}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="h-11 flex-1 rounded-xl font-medium text-sm border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="h-11 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 border border-slate-100 shadow-xl bg-white dark:bg-slate-900 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Delete user?</h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            This will revoke all access for{' '}
            <span className="font-medium text-slate-900 dark:text-white">{userToDelete?.name}</span>. This action cannot be undone.
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="h-11 w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm shadow-sm"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Yes, delete user
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="h-11 w-full rounded-xl font-medium text-sm text-slate-600"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UsersPage;
