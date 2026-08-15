'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, extractErrorMessage } from '@/lib/api';
import { checkAndRecord } from '@/lib/rateLimit';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
    });
    const [loading, setLoading] = useState(false);
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

        if (form.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (form.password !== form.password_confirm) {
            toast.error('Passwords do not match');
            return;
        }

        const { limited, waitSeconds: wait } = checkAndRecord('register');
        if (limited) {
            setRateLimited(true);
            setWaitSeconds(wait);
            toast.error(`Too many registration attempts. Please wait ${wait} seconds.`);
            return;
        }

        setLoading(true);
        try {
            await authAPI.register(form);
            toast.success('Verification code sent to your email!');
            router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
        } catch (err) {
            if (err.response?.status === 429) {
                setRateLimited(true);
                setWaitSeconds(60);
            } else {
                const details = err.response?.data?.details;
                if (details?.email) toast.error('Email already registered');
                else toast.error(extractErrorMessage(err, 'Registration failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading || rateLimited;

    return (
        <div className="flex flex-col min-h-screen pt-20 bg-surface text-primary">
            <main className="flex-grow flex items-center justify-center px-margin-mobile py-stack-lg">
                <div className="w-full max-w-[400px] flex flex-col gap-10">
                    <div className="text-center">
                        <h1 className="font-display text-3xl mb-2">Create Account</h1>
                        <p className="text-on-surface-variant text-sm font-light">Join Tvisaa to explore bespoke craftsmanship.</p>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                placeholder="FULL NAME"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-transparent border-0 border-b border-outline py-2 text-xs uppercase tracking-wider text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                                required
                                disabled={isDisabled}
                            />
                        </div>

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

                        <div>
                            <input
                                type="tel"
                                placeholder="PHONE NUMBER (OPTIONAL)"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full bg-transparent border-0 border-b border-outline py-2 text-xs uppercase tracking-wider text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                                disabled={isDisabled}
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="PASSWORD"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-transparent border-0 border-b border-outline py-2 text-xs uppercase tracking-wider text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                                minLength={8}
                                required
                                disabled={isDisabled}
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="CONFIRM PASSWORD"
                                value={form.password_confirm}
                                onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                                className="w-full bg-transparent border-0 border-b border-outline py-2 text-xs uppercase tracking-wider text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                                required
                                disabled={isDisabled}
                            />
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" className="mt-1 border-outline bg-transparent" />
                            <span className="text-xs text-on-surface-variant font-light">Subscribe to receive exclusive insights and bespoke offers.</span>
                        </label>

                        {rateLimited && waitSeconds > 0 && (
                            <p className="text-xs text-center text-error font-body">
                                Too many attempts. Try again in <span className="font-bold">{waitSeconds}s</span>
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isDisabled}
                            className="w-full py-4 border border-primary uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:bg-secondary hover:text-white transition-all font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : rateLimited && waitSeconds > 0 ? `Wait ${waitSeconds}s` : 'Create Account'}
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </form>

                    <p className="text-center text-xs text-on-surface-variant font-light">
                        Already have an account? <Link href="/auth/login" className="underline font-bold text-primary">Sign In</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
