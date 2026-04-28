import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../services/crmService';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { profile, refreshProfile } = useAuth() as any;

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [mobile, setMobile] = useState(profile?.mobile || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setName(profile?.name || '');
    setEmail(profile?.email || '');
    setMobile(profile?.mobile || '');
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.uid) return;
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(profile.uid, {
        name: name.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
      });
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const RoleBadge = () => {
    switch ((profile?.role || '').toLowerCase()) {
      case 'admin':
        return (
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-none hover:bg-rose-50">
            <ShieldAlert className="w-3 h-3" /> Administrator
          </Badge>
        );
      case 'manager':
        return (
          <Badge className="bg-blue-50 text-blue-600 border border-blue-100 gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-none hover:bg-blue-50">
            <ShieldCheck className="w-3 h-3" /> Manager
          </Badge>
        );
      default:
        return (
          <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-none hover:bg-indigo-50">
            <UserIcon className="w-3 h-3" /> Sales
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-8 pb-12 max-w-4xl"
    >
      {/* Page header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and account details.</p>
        </div>
      </div>

      {/* Identity card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="w-20 h-20 border border-slate-100 dark:border-white/10 shadow-sm">
              <AvatarImage src={profile?.photoUrl} className="object-cover" />
              <AvatarFallback className="bg-indigo-50 text-indigo-600 text-2xl font-semibold">
                {profile?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {profile?.name || 'Unnamed User'}
                </h2>
                <RoleBadge />
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                {profile?.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {profile.email}
                  </span>
                )}
                {profile?.mobile && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {profile.mobile}
                  </span>
                )}
                {profile?.username && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" /> @{profile.username}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit personal info */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="section-title">Personal Information</h3>
          <p className="text-sm text-slate-500 mt-0.5">Update your contact details and display name.</p>
        </div>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Full name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 font-normal text-sm shadow-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Email address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 font-normal text-sm shadow-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Mobile number</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 font-normal text-sm shadow-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Username</Label>
              <Input
                disabled
                value={profile?.username || ''}
                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 font-normal text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Role</Label>
              <Input
                disabled
                value={profile?.role || ''}
                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 font-normal text-sm text-slate-500 capitalize cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex items-center justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account meta */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="section-title">Account</h3>
          <p className="text-sm text-slate-500 mt-0.5">Read-only details about this session.</p>
        </div>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-xs text-slate-500 mb-1">Account ID</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{profile?.uid || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Role</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{profile?.role || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Created</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Profile;
