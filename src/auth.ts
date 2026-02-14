import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: hasGoogleOAuth
        ? [
            Google({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
        ]
        : [
            Credentials({
                id: "google",
                name: "Google",
                credentials: {},
                async authorize() {
                    return {
                        id: "demo-google-user",
                        name: "Guest User",
                        email: "guest@lootmart.demo",
                        image:
                            "https://www.lootmart.com.pk/_next/image?url=%2Flogo-header-300x147.png&w=384&q=75",
                    };
                },
            }),
        ],
    pages: {
        signIn: "/",
    },
    callbacks: {
        // JWT callback — runs on every token creation/refresh
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token;
                token.id = profile?.sub;
            }
            return token;
        },
        // Session callback — exposes data to client
        async session({ session, token }) {
            if (token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
        // Authorized callback — middleware-level auth check
        authorized({ auth: authSession, request: { nextUrl } }) {
            const isLoggedIn = !!authSession?.user;
            const isProtected = nextUrl.pathname.startsWith("/checkout");
            if (isProtected && !isLoggedIn) {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
    },
    // Enable JWT strategy (serverless-friendly, no DB needed)
    trustHost: true,
    secret:
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        "lootmart-demo-fallback-secret-change-in-production",
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
});
