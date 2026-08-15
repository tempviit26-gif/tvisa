'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, extractErrorMessage } from '@/lib/api';
import { checkAndRecord, clearAttempts } from '@/lib/rateLimit';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rateLimited, setRateLimited] = useState(false);
    const [waitSeconds, setWaitSeconds] = useState(0);

    useEffect(() => {
        if (waitSeconds <= 0) {
            setRateLimited(false);
            return;
        }
        const timer = setTimeout(() => setWaitSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [waitSeconds]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error('Please fill all fields');
            return;
        }

        const { limited, waitSeconds: wait } = checkAndRecord('login');
        if (limited) {
            setRateLimited(true);
            setWaitSeconds(wait);
            toast.error(`Too many login attempts. Please wait ${wait} seconds.`);
            return;
        }

        setLoading(true);
        try {
            await authAPI.login(form);

            const result = await signIn('credentials', {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (result?.error) {
                toast.error('Login failed. Please try again.');
                setLoading(false);
            } else {
                clearAttempts('login');
                toast.success('Welcome back!');
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            const details = err.response?.data?.details;
            if (err.response?.status === 429) {
                setRateLimited(true);
                setWaitSeconds(60);
            } else if (details?.email_not_verified) {
                toast.error('Please verify your email first');
                router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
            } else {
                toast.error(extractErrorMessage(err, 'Invalid email or password'));
            }
            setLoading(false);
        }
    };

    const isDisabled = loading || rateLimited;

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-stack-lg text-primary">
            <Link href="/" className="font-display text-4xl mb-12 tracking-tight">Tvisaa</Link>
            
            <div className="w-full max-w-[400px] flex flex-col gap-10">
                <div className="text-center">
                    <h1 className="font-display text-3xl mb-2">Sign In</h1>
                    <p className="text-on-surface-variant text-sm font-light">Enter your details to access your atelier.</p>
                </div>

                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="email"
                            placeholder="EMAIL ADDRESS"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-transparent border-0 border-b border-outline py-2 text-xs uppercase tracking-wider text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                            required
                            disabled={isDisabled}
                        />
                    </div>

                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="PASSWORD"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-transparent border-0 border-b border-outline py-2 text-xs uppercase tracking-wider text-primary focus:ring-0 focus:border-primary transition-colors outline-none pr-8"
                            required
                            disabled={isDisabled}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 bottom-2 text-outline hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {showPassword ? 'visibility' : 'visibility_off'}
                            </span>
                        </button>
                    </div>

                    {rateLimited && waitSeconds > 0 && (
                        <p className="text-xs text-center text-error font-body">
                            Too many attempts. Try again in <span className="font-bold">{waitSeconds}s</span>
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isDisabled}
                        className="w-full py-4 border border-primary uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all mt-4 font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Signing In...' : rateLimited && waitSeconds > 0 ? `Wait ${waitSeconds}s` : 'Sign In'}
                    </button>
                </form>

                <div className="flex items-center gap-4">
                    <div className="h-px bg-outline/20 flex-grow"></div>
                    <span className="text-[10px] text-outline uppercase tracking-widest">OR</span>
                    <div className="h-px bg-outline/20 flex-grow"></div>
                </div>

                <Link
                    href="/auth/register"
                    className="w-full py-4 border border-outline/30 uppercase tracking-widest text-xs text-center hover:border-primary transition-colors font-semibold"
                >
                    Create Account
                </Link>
            </div>
        </div>
    );
}
