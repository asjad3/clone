import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isAdminEmail } from "@/lib/auth/admin-access";

const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: (() => {
        if (hasGoogleOAuth) {
            return [
                Google({
                    clientId: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                }),
            ];
        }

        if (process.env.NODE_ENV === "production" && !isProductionBuild) {
            throw new Error("Google OAuth must be configured in production");
        }

        return [
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
        ];
    })(),
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
            const pathname = nextUrl.pathname;
            const isCheckoutPath = pathname.startsWith("/checkout");
            const isAdminPagePath = pathname.startsWith("/admin");
            const isAdminApiPath = pathname.startsWith("/api/admin");

            if (isCheckoutPath && !isLoggedIn) {
                return Response.redirect(new URL("/", nextUrl));
            }

            if (isAdminPagePath || isAdminApiPath) {
                const email = authSession?.user?.email ?? null;
                const allowed = isLoggedIn && isAdminEmail(email);

                if (!allowed) {
                    if (isAdminApiPath) {
                        return new Response(JSON.stringify({ error: "Forbidden" }), {
                            status: 403,
                            headers: {
                                "Content-Type": "application/json",
                                "Cache-Control": "private, no-store, no-cache, must-revalidate",
                            },
                        });
                    }

                    return Response.redirect(new URL("/", nextUrl));
                }
            }

            return true;
        },
    },
    // Enable JWT strategy (serverless-friendly, no DB needed)
    trustHost: true,
    secret: (() => {
        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
        if (!secret && process.env.NODE_ENV === "production" && !isProductionBuild) {
            throw new Error("AUTH_SECRET environment variable is required in production");
        }
        // Only fall back to a generated value in local development
        return secret || "dev-only-secret-" + (process.env.HOSTNAME || "localhost");
    })(),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
});
