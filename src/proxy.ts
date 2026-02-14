export { auth as proxy } from "@/auth";

export const config = {
    // Protect checkout routes with auth proxy
    matcher: ["/checkout/:path*"],
};