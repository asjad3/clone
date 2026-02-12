export { auth as middleware } from "@/auth";

export const config = {
    // Protect checkout routes with auth middleware
    matcher: ["/checkout/:path*"],
};
