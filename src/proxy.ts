export { auth as proxy } from "@/auth";

export const config = {
    // Protect checkout and admin surfaces with auth proxy
    matcher: ["/checkout/:path*", "/admin/:path*", "/api/admin/:path*"],
};
