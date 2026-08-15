import CredentialsProvider from 'next-auth/providers/credentials';
import { authAPI } from '@/lib/api';

async function refreshAccessToken(token) {
    try {
        const res = await authAPI.refreshToken(token.refreshToken);
        const { data } = res.data;
        return {
            ...token,
            accessToken: data.access,
            refreshToken: data.refresh || token.refreshToken,
            accessTokenExpires: Date.now() + 14 * 60 * 1000, // 14 minutes
        };
    } catch {
        // Refresh token is also expired — force re-login
        return {
            ...token,
            error: 'RefreshAccessTokenError',
        };
    }
}

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const res = await authAPI.login({
                        email: credentials.email,
                        password: credentials.password,
                    });

                    const { data } = res.data;
                    if (data?.user && data?.tokens) {
                        return {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            phone: data.user.phone,
                            accessToken: data.tokens.access,
                            refreshToken: data.tokens.refresh,
                        };
                    }
                    return null;
                } catch {
                    return null;
                }
            },
        }),
    ],
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign-in — store tokens + expiry
            if (user) {
                token.id = user.id;
                token.phone = user.phone;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.accessTokenExpires = Date.now() + 14 * 60 * 1000; // 14 min
                return token;
            }

            // Token is still valid
            if (Date.now() < (token.accessTokenExpires || 0)) {
                return token;
            }

            // Token expired — try to refresh
            return await refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.phone = token.phone;
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
