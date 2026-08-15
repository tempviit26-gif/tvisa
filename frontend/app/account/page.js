'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { authAPI, extractErrorMessage } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import Link from 'next/link';
import { FiUser, FiPackage, FiMapPin, FiHeart, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ name: '', phone: '' });
    const [editing, setEditing] = useState(false);

    const { data: profile } = useQuery({
        queryKey: QUERY_KEYS.profile,
        queryFn: async () => {
            const res = await authAPI.getProfile();
            return res.data?.data || res.data;
        },
        enabled: !!session,
    });

    const updateMutation = useMutation({
        mutationFn: (data) => authAPI.updateProfile(data),
        onSuccess: () => {
            toast.success('Profile updated');
            setEditing(false);
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update profile')),
    });

    // Auth gate — after all hooks
    if (status === 'unauthenticated') {
        router.push('/auth/login');
        return null;
    }

    if (status === 'loading') {
        return <div className="max-w-3xl mx-auto px-4 py-12"><div className="skeleton h-96 w-full" /></div>;
    }

    const startEdit = () => {
        setForm({ name: profile?.name || '', phone: profile?.phone || '' });
        setEditing(true);
    };

    const menuItems = [
        { icon: FiPackage, label: 'My Orders', href: '/account/orders', desc: 'Track and manage your orders' },
        { icon: FiMapPin, label: 'Addresses', href: '/account/addresses', desc: 'Manage delivery addresses' },
        { icon: FiHeart, label: 'Wishlist', href: '/wishlist', desc: 'Your saved items' },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="font-cormorant text-3xl lg:text-4xl text-noir mb-10">My Account</h1>

            <div className="bg-white border border-blush p-6 mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-petal border border-blush flex items-center justify-center">
                            <FiUser size={24} className="text-deep-rose" />
                        </div>
                        <div>
                            <h2 className="font-cormorant text-xl text-noir">{profile?.name || session?.user?.name}</h2>
                            <p className="text-sm text-mid font-light">{profile?.email || session?.user?.email}</p>
                        </div>
                    </div>
                    {!editing && (
                        <button onClick={startEdit} className="text-sm text-deep-rose hover:underline">Edit</button>
                    )}
                </div>

                {editing && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-blush">
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full px-4 py-2.5 border border-blush text-sm outline-none focus:border-deep-rose transition-colors" />
                        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full px-4 py-2.5 border border-blush text-sm outline-none focus:border-deep-rose transition-colors" />
                        <div className="flex gap-3">
                            <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="bg-deep-rose text-white px-6 py-2 text-sm hover:bg-deep-rose/90 transition-colors">Save</button>
                            <button onClick={() => setEditing(false)} className="text-mid text-sm hover:text-noir">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {menuItems.map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-4 bg-white border border-blush p-5 hover:border-deep-rose/30 hover:shadow-sm transition-all group">
                        <item.icon size={22} className="text-deep-rose" />
                        <div>
                            <h3 className="text-sm font-medium text-noir group-hover:text-deep-rose transition-colors">{item.label}</h3>
                            <p className="text-xs text-mid font-light">{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 mt-8 text-sm text-deep-rose hover:underline">
                <FiLogOut size={16} /> Sign Out
            </button>
        </div>
    );
}
