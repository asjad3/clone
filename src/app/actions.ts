"use server";

import { revalidateTag, revalidatePath } from "next/cache";

// ==================== SERVER ACTIONS ====================
// Next.js 16 Server Actions with cache invalidation
// revalidateTag() requires a cacheLife profile as 2nd arg

/**
 * Server Action: Revalidate product data
 * Uses revalidateTag() with "max" cacheLife profile
 */
export async function revalidateProducts() {
    revalidateTag("products", "max");
    return { success: true, timestamp: Date.now() };
}

/**
 * Server Action: Revalidate store data
 * Uses revalidateTag() for selective cache invalidation
 */
export async function revalidateStore(slug: string) {
    revalidateTag(`store-${slug}`, "max");
    revalidatePath(`/store/${slug}`, "page");
    return { success: true, slug, timestamp: Date.now() };
}

/**
 * Server Action: Submit contact form
 * Demonstrates form handling with Server Actions
 */
export async function submitContactForm(formData: FormData) {
    const name = formData.get("name") as string;
    const message = formData.get("message") as string;

    await new Promise((r) => setTimeout(r, 500));

    if (!name || !message) {
        return { success: false, error: "Name and message are required" };
    }

    console.log("[Server Action] Contact form:", { name, message });
    return { success: true, message: `Thank you ${name}! We'll get back to you soon.` };
}

/**
 * Server Action: Track product view for analytics
 */
export async function trackProductView(productId: number, storeSlug: string) {
    console.log("[Server Action] Product view:", { productId, storeSlug, timestamp: Date.now() });
    return { tracked: true };
}

/**
 * Server Action: Revalidate homepage
 */
export async function revalidateHomepage() {
    revalidatePath("/", "page");
    return { success: true };
}
