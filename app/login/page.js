'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { signIn, signUp } from '@/lib/firebase/auth';

export default function LoginPage() {
    const router = useRouter();
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignup) {
                const { error: signupError } = await signUp(
                    formData.email,
                    formData.password,
                    formData.displayName
                );
                if (signupError) {
                    setError(signupError);
                } else {
                    router.push('/account');
                }
            } else {
                const { error: signinError } = await signIn(formData.email, formData.password);
                if (signinError) {
                    setError(signinError);
                } else {
                    router.push('/account');
                }
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen-safe flex items-center justify-center bg-neutral-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-card p-8">
                    <h1 className="text-2xl font-display font-bold text-center mb-6">
                        {isSignup ? 'Create Account' : 'Welcome Back'}
                    </h1>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && (
                            <Input
                                label="Full Name"
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                required
                            />
                        )}

                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            helperText="Minimum 6 characters"
                            required
                        />

                        <Button type="submit" fullWidth size="lg" loading={loading}>
                            {isSignup ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsSignup(!isSignup);
                                setError('');
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/checkout" className="text-neutral-600 hover:text-neutral-900 text-sm">
                            Continue as Guest
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
