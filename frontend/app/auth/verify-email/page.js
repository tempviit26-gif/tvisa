'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { authAPI, extractErrorMessage } from '@/lib/api';
import { checkAndRecord } from '@/lib/rateLimit';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    // Cooldown for the Resend button (UI + rate-limit layer)
    const [cooldown, setCooldown] = useState(0);

    // Rate-limit lockout for verify submissions
    const [verifyLimited, setVerifyLimited] = useState(false);
    const [verifyWait, setVerifyWait] = useState(0);

    const inputRefs = useRef([]);

    // Resend button countdown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Verify rate-limit countdown
    useEffect(() => {
        if (verifyWait <= 0) {
            setVerifyLimited(false);
            return;
        }
        const timer = setTimeout(() => setVerifyWait((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [verifyWait]);

    // Auto-focus first input
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').split('').slice(0, 6);
            const newOtp = [...otp];
            digits.forEach((d, i) => {
                if (index + i < 6) newOtp[index + i] = d;
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        // Client-side rate limit check for OTP verification
        const { limited, waitSeconds: wait } = checkAndRecord('otp_verify');
        if (limited) {
            setVerifyLimited(true);
            setVerifyWait(wait);
            toast.error(`Too many verification attempts. Please wait ${wait} seconds.`, {
                icon: '🚦',
                duration: 5000,
            });
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.verifyOTP({ email, otp: otpCode });
            toast.success('Email verified successfully!');

            // Auto sign in with the returned tokens
            const result = await signIn('credentials', {
                redirect: false,
                email: email,
                password: '_otp_verified_',  // special flag
            });

            // Even if auto-login fails, redirect to login page
            if (result?.error) {
                toast.success('Please sign in with your credentials');
                router.push('/auth/login');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            if (err.response?.status === 429) {
                // Backend 429 — already handled by the API client toast
                setVerifyLimited(true);
                setVerifyWait(60);
            } else {
                toast.error(extractErrorMessage(err, 'Invalid or expired OTP'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        // Client-side rate limit check for OTP resend (3 per 5 min)
        const { limited, waitSeconds: wait } = checkAndRecord('otp_resend');
        if (limited) {
            setCooldown(wait);
            toast.error(`Please wait ${wait} seconds before requesting a new code.`, {
                icon: '🚦',
                duration: 5000,
            });
            return;
        }

        setResending(true);
        try {
            await authAPI.resendOTP({ email });
            toast.success('A new verification code has been sent!');
            setCooldown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            if (err.response?.status === 429) {
                // Backend 429 — already handled by API client toast
                setCooldown(60);
            } else {
                toast.error('Failed to resend code');
            }
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="font-cormorant text-3xl text-noir mb-4">No Email Provided</h1>
                    <p className="text-mid text-sm mb-6">Please register first to receive a verification code.</p>
                    <Link href="/auth/register" className="text-deep-rose hover:underline text-sm">
                        Go to Register
                    </Link>
                </div>
            </div>
        );
    }

    const verifyDisabled = loading || verifyLimited || otp.join('').length !== 6;

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
                <Image src="/images/logo.png" alt="Lumière Jewels" width={160} height={40} className="h-10 w-auto mx-auto mb-8" />

                {/* Mail icon */}
                <div className="w-16 h-16 bg-petal rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-deep-rose" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <h1 className="font-cormorant text-3xl text-noir mb-2">Verify Your Email</h1>
                <p className="text-sm text-mid font-light mb-1">
                    We sent a 6-digit verification code to
                </p>
                <p className="text-sm text-noir font-medium mb-8">{email}</p>

                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-3 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={loading || verifyLimited}
                            className="w-12 h-14 text-center text-xl font-jost font-medium border-2 border-blush bg-white text-noir outline-none focus:border-deep-rose transition-colors disabled:opacity-50"
                        />
                    ))}
                </div>

                {verifyLimited && verifyWait > 0 && (
                    <p className="text-xs text-center text-deep-rose/80 font-jost mb-4">
                        🚦 Too many attempts. Try again in{' '}
                        <span className="font-semibold">{verifyWait}s</span>
                    </p>
                )}

                <button
                    onClick={handleVerify}
                    disabled={verifyDisabled}
                    className="w-full bg-deep-rose text-white py-3.5 text-sm font-jost font-medium tracking-wider uppercase hover:bg-deep-rose/90 transition-colors disabled:opacity-50 mb-6"
                >
                    {loading
                        ? 'Verifying...'
                        : verifyLimited && verifyWait > 0
                        ? `Try again in ${verifyWait}s`
                        : 'Verify Email'}
                </button>

                <p className="text-sm text-mid font-light">
                    {"Didn't receive the code? "}
                    {cooldown > 0 ? (
                        <span className="text-mid/60">Resend in {cooldown}s</span>
                    ) : (
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-deep-rose hover:underline font-medium"
                        >
                            {resending ? 'Sending...' : 'Resend Code'}
                        </button>
                    )}
                </p>

                <p className="text-xs text-mid/50 mt-4 font-light">
                    The code expires in 10 minutes
                </p>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="skeleton h-96 w-96" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
