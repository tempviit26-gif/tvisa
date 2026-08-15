'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { authAPI, extractErrorMessage } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import { FiMapPin, FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AddressesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ full_name: '', street: '', city: '', state: '', pincode: '' });

    const { data: addresses, isLoading } = useQuery({
        queryKey: QUERY_KEYS.addresses,
        queryFn: async () => {
            const res = await authAPI.getAddresses();
            return res.data?.data || res.data;
        },
        enabled: !!session,
    });

    const createMutation = useMutation({
        mutationFn: (data) => authAPI.createAddress(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
            setShowForm(false);
            setForm({ full_name: '', street: '', city: '', state: '', pincode: '' });
            toast.success('Address added');
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to add address')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => authAPI.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
            toast.success('Address deleted');
        },
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id) => authAPI.setDefaultAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
            toast.success('Default address updated');
        },
    });

    // Auth gate — after all hooks
    if (status === 'unauthenticated') {
        router.push('/auth/login');
        return null;
    }

    if (status === 'loading') {
        return <div className="max-w-3xl mx-auto px-4 py-12"><div className="skeleton h-96 w-full" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-cormorant text-3xl text-noir">My Addresses</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 text-sm text-deep-rose hover:underline"
                >
                    <FiPlus size={16} /> Add New
                </button>
            </div>

            {showForm && (
                <div className="bg-white border border-blush p-5 mb-6 space-y-3">
                    {['full_name', 'street', 'city', 'state', 'pincode'].map((field) => (
                        <input
                            key={field}
                            type="text"
                            value={form[field]}
                            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                            placeholder={field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            className="w-full px-4 py-2.5 border border-blush text-sm outline-none focus:border-deep-rose transition-colors"
                        />
                    ))}
                    <div className="flex gap-3">
                        <button
                            onClick={() => createMutation.mutate(form)}
                            disabled={createMutation.isPending}
                            className="bg-deep-rose text-white px-6 py-2.5 text-sm hover:bg-deep-rose/90"
                        >
                            Save
                        </button>
                        <button onClick={() => setShowForm(false)} className="text-mid text-sm hover:text-noir">Cancel</button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
            ) : (addresses || []).length > 0 ? (
                <div className="space-y-3">
                    {addresses.map((addr) => (
                        <div key={addr.id} className={`bg-white border p-5 ${addr.is_default ? 'border-deep-rose' : 'border-blush'}`}>
                            <div className="flex justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-noir">{addr.full_name}</p>
                                        {addr.is_default && (
                                            <span className="text-[10px] bg-deep-rose text-white px-2 py-0.5 uppercase tracking-wider">Default</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-mid font-light">{addr.street}</p>
                                    <p className="text-sm text-mid font-light">{addr.city}, {addr.state} — {addr.pincode}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!addr.is_default && (
                                        <button
                                            onClick={() => setDefaultMutation.mutate(addr.id)}
                                            className="text-xs text-deep-rose hover:underline flex items-center gap-1"
                                        >
                                            <FiCheck size={12} /> Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteMutation.mutate(addr.id)}
                                        className="text-xs text-mid hover:text-deep-rose flex items-center gap-1"
                                    >
                                        <FiTrash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <FiMapPin size={48} className="mx-auto text-blush mb-4" />
                    <p className="text-mid">No addresses saved</p>
                </div>
            )}
        </div>
    );
}
