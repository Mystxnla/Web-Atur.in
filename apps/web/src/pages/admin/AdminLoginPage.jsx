import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../../services/api/auth.js';
import { useAuthStore } from '../../stores/authStore.js';
import { toast } from 'sonner';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Logo from '../../components/ui/Logo.jsx';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const result = await authApi.login(data);
      if (!['admin', 'superadmin'].includes(result.user.role)) {
        toast.error('Akun ini tidak memiliki akses admin.');
        return;
      }
      setAuth(result);
      toast.success(`Selamat datang, ${result.user.name}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message ?? 'Login gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Masuk dengan akun admin kamu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="admin@atur-in.id"
              required
              error={errors.email?.message}
              {...register('email', { required: 'Email wajib diisi.' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              required
              error={errors.password?.message}
              {...register('password', { required: 'Password wajib diisi.' })}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Masuk ke Admin Panel
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={12} className="text-success-500" aria-hidden />
          Akses terbatas. Hanya untuk tim Digital Workspace Architect.
        </p>
      </div>
    </div>
  );
}
