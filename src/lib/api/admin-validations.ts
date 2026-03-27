import {
    AdminApiError,
    STORE_STATUSES,
    assertOrderStatus,
    ensureObject,
    readNullableNumber,
    readNullableString,
    readOptionalBoolean,
    readOptionalEnum,
    readOptionalNumber,
    readOptionalObject,
    readOptionalString,
    readOptionalStringArray,
    readRequiredNumber,
    readRequiredString,
    readRequiredUuid,
    slugifyDash,
    slugifyLtree,
} from "@/lib/api/admin-route";

const DASH_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseProductPayload(raw: unknown, mode: "create" | "update") {
    const body = ensureObject(raw);
    const payload: Record<string, unknown> = {};

    const name = mode === "create"
        ? readRequiredString(body, "name", { maxLength: 200 })
        : readOptionalString(body, "name", { maxLength: 200 });

    if (name !== undefined) {
        payload.name = name;
    }

    const providedSlug = readOptionalString(body, "slug", {
        maxLength: 200,
        pattern: DASH_SLUG_REGEX,
    });
    if (providedSlug !== undefined) {
        payload.slug = providedSlug;
    } else if (mode === "create") {
        payload.slug = slugifyDash((name as string | undefined) ?? "");
    }

    const basePrice = mode === "create"
        ? readRequiredNumber(body, "base_price", { min: 0 })
        : readOptionalNumber(body, "base_price", { min: 0 });
    if (basePrice !== undefined) {
        payload.base_price = basePrice;
    }

    const categoryId = mode === "create"
        ? readRequiredNumber(body, "category_id", { integer: true, min: 1 })
        : readOptionalNumber(body, "category_id", { integer: true, min: 1 });
    if (categoryId !== undefined) {
        payload.category_id = categoryId;
    }

    const brandId = readNullableNumber(body, "brand_id", { integer: true, min: 1 });
    if (brandId !== undefined) {
        payload.brand_id = brandId;
    } else if (mode === "create") {
        payload.brand_id = null;
    }

    const description = readNullableString(body, "description", { maxLength: 5000 });
    if (description !== undefined) {
        payload.description = description;
    }

    const weight = readNullableString(body, "weight", { maxLength: 64 });
    if (weight !== undefined) {
        payload.weight = weight;
    }

    const weightValue = readNullableNumber(body, "weight_value", { min: 0 });
    if (weightValue !== undefined) {
        payload.weight_value = weightValue;
    }

    const weightUnit = readNullableString(body, "weight_unit", { maxLength: 16 });
    if (weightUnit !== undefined) {
        payload.weight_unit = weightUnit;
    }

    const imageUrl = readNullableString(body, "image_url", { maxLength: 2048 });
    if (imageUrl !== undefined) {
        payload.image_url = imageUrl;
    }

    const images = readOptionalStringArray(body, "images");
    if (images !== undefined) {
        payload.images = images;
    }

    const tags = readOptionalStringArray(body, "tags");
    if (tags !== undefined) {
        payload.tags = tags;
    }

    const attributes = readOptionalObject(body, "attributes");
    if (attributes !== undefined) {
        payload.attributes = attributes;
    } else if (mode === "create") {
        payload.attributes = {};
    }

    const isActive = readOptionalBoolean(body, "is_active");
    if (isActive !== undefined) {
        payload.is_active = isActive;
    } else if (mode === "create") {
        payload.is_active = true;
    }

    if (mode === "update" && Object.keys(payload).length === 0) {
        throw new AdminApiError(400, "No valid product fields provided");
    }

    return payload;
}

export function parseCategoryPayload(raw: unknown, mode: "create" | "update") {
    const body = ensureObject(raw);
    const payload: Record<string, unknown> = {};

    const name = mode === "create"
        ? readRequiredString(body, "name", { maxLength: 150 })
        : readOptionalString(body, "name", { maxLength: 150 });
    if (name !== undefined) {
        payload.name = name;
    }

    const providedSlug = readOptionalString(body, "slug", { maxLength: 150 });
    if (providedSlug !== undefined) {
        payload.slug = slugifyLtree(providedSlug);
    } else if (mode === "create") {
        payload.slug = slugifyLtree((name as string | undefined) ?? "");
    }

    const parentId = readNullableNumber(body, "parent_id", { integer: true, min: 1 });
    if (parentId !== undefined) {
        payload.parent_id = parentId;
    } else if (mode === "create") {
        payload.parent_id = null;
    }

    const isActive = readOptionalBoolean(body, "is_active");
    if (isActive !== undefined) {
        payload.is_active = isActive;
    } else if (mode === "create") {
        payload.is_active = true;
    }

    const sortOrder = readOptionalNumber(body, "sort_order", { integer: true });
    if (sortOrder !== undefined) {
        payload.sort_order = sortOrder;
    }

    const imageUrl = readNullableString(body, "image_url", { maxLength: 2048 });
    if (imageUrl !== undefined) {
        payload.image_url = imageUrl;
    }

    if (mode === "update" && Object.keys(payload).length === 0) {
        throw new AdminApiError(400, "No valid category fields provided");
    }

    return payload;
}

export function parseBrandPayload(raw: unknown, mode: "create" | "update") {
    const body = ensureObject(raw);
    const payload: Record<string, unknown> = {};

    const name = mode === "create"
        ? readRequiredString(body, "name", { maxLength: 150 })
        : readOptionalString(body, "name", { maxLength: 150 });
    if (name !== undefined) {
        payload.name = name;
    }

    const providedSlug = readOptionalString(body, "slug", {
        maxLength: 150,
        pattern: DASH_SLUG_REGEX,
    });
    if (providedSlug !== undefined) {
        payload.slug = providedSlug;
    } else if (mode === "create") {
        payload.slug = slugifyDash((name as string | undefined) ?? "");
    }

    const logoUrl = readNullableString(body, "logo_url", { maxLength: 2048 });
    if (logoUrl !== undefined) {
        payload.logo_url = logoUrl;
    }

    const isActive = readOptionalBoolean(body, "is_active");
    if (isActive !== undefined) {
        payload.is_active = isActive;
    } else if (mode === "create") {
        payload.is_active = true;
    }

    if (mode === "update" && Object.keys(payload).length === 0) {
        throw new AdminApiError(400, "No valid brand fields provided");
    }

    return payload;
}

export function parseAreaPayload(raw: unknown, mode: "create" | "update") {
    const body = ensureObject(raw);
    const payload: Record<string, unknown> = {};

    const name = mode === "create"
        ? readRequiredString(body, "name", { maxLength: 120 })
        : readOptionalString(body, "name", { maxLength: 120 });
    if (name !== undefined) {
        payload.name = name;
    }

    const city = mode === "create"
        ? readRequiredString(body, "city", { maxLength: 120 })
        : readOptionalString(body, "city", { maxLength: 120 });
    if (city !== undefined) {
        payload.city = city;
    }

    const lat = readNullableNumber(body, "lat", { min: -90, max: 90 });
    if (lat !== undefined) {
        payload.lat = lat;
    }

    const lng = readNullableNumber(body, "lng", { min: -180, max: 180 });
    if (lng !== undefined) {
        payload.lng = lng;
    }

    const isActive = readOptionalBoolean(body, "is_active");
    if (isActive !== undefined) {
        payload.is_active = isActive;
    } else if (mode === "create") {
        payload.is_active = true;
    }

    if (mode === "update" && Object.keys(payload).length === 0) {
        throw new AdminApiError(400, "No valid area fields provided");
    }

    return payload;
}

export function parseStorePayload(raw: unknown, mode: "create" | "update") {
    const body = ensureObject(raw);
    const payload: Record<string, unknown> = {};

    const ownerId = mode === "create"
        ? readRequiredUuid(body, "owner_id")
        : (() => {
            const value = body.owner_id;
            if (value === undefined) return undefined;
            if (value === null) throw new AdminApiError(400, "owner_id cannot be null");
            return readRequiredUuid(body, "owner_id");
        })();
    if (ownerId !== undefined) {
        payload.owner_id = ownerId;
    }

    const name = mode === "create"
        ? readRequiredString(body, "name", { maxLength: 150 })
        : readOptionalString(body, "name", { maxLength: 150 });
    if (name !== undefined) {
        payload.name = name;
    }

    const providedSlug = readOptionalString(body, "slug", {
        maxLength: 150,
        pattern: DASH_SLUG_REGEX,
    });
    if (providedSlug !== undefined) {
        payload.slug = providedSlug;
    } else if (mode === "create") {
        payload.slug = slugifyDash((name as string | undefined) ?? "");
    }

    const storeType = readOptionalString(body, "store_type", { maxLength: 50 });
    if (storeType !== undefined) {
        payload.store_type = storeType;
    } else if (mode === "create") {
        payload.store_type = "mart";
    }

    const status = readOptionalEnum(body, "status", STORE_STATUSES);
    if (status !== undefined) {
        payload.status = status;
    } else if (mode === "create") {
        payload.status = "pending";
    }

    const sameDayDelivery = readOptionalBoolean(body, "same_day_delivery");
    if (sameDayDelivery !== undefined) {
        payload.same_day_delivery = sameDayDelivery;
    } else if (mode === "create") {
        payload.same_day_delivery = false;
    }

    const deliveryCharges = readOptionalNumber(body, "delivery_charges", { min: 0 });
    if (deliveryCharges !== undefined) {
        payload.delivery_charges = deliveryCharges;
    } else if (mode === "create") {
        payload.delivery_charges = 0;
    }

    const minOrderValue = readOptionalNumber(body, "min_order_value", { min: 0 });
    if (minOrderValue !== undefined) {
        payload.min_order_value = minOrderValue;
    } else if (mode === "create") {
        payload.min_order_value = 0;
    }

    const freeDeliveryThreshold = readOptionalNumber(body, "free_delivery_threshold", { min: 0 });
    if (freeDeliveryThreshold !== undefined) {
        payload.free_delivery_threshold = freeDeliveryThreshold;
    } else if (mode === "create") {
        payload.free_delivery_threshold = 0;
    }

    const description = readNullableString(body, "description", { maxLength: 5000 });
    if (description !== undefined) {
        payload.description = description;
    }

    const logoUrl = readNullableString(body, "logo_url", { maxLength: 2048 });
    if (logoUrl !== undefined) {
        payload.logo_url = logoUrl;
    }

    const bannerUrl = readNullableString(body, "banner_url", { maxLength: 2048 });
    if (bannerUrl !== undefined) {
        payload.banner_url = bannerUrl;
    }

    const storeHours = readNullableString(body, "store_hours", { maxLength: 200 });
    if (storeHours !== undefined) {
        payload.store_hours = storeHours;
    }

    const deliveryHours = readNullableString(body, "delivery_hours", { maxLength: 200 });
    if (deliveryHours !== undefined) {
        payload.delivery_hours = deliveryHours;
    }

    const contactPhone = readNullableString(body, "contact_phone", { maxLength: 50 });
    if (contactPhone !== undefined) {
        payload.contact_phone = contactPhone;
    }

    const contactEmail = readNullableString(body, "contact_email", { maxLength: 255 });
    if (contactEmail !== undefined) {
        payload.contact_email = contactEmail;
    }

    const address = readNullableString(body, "address", { maxLength: 500 });
    if (address !== undefined) {
        payload.address = address;
    }

    const lat = readNullableNumber(body, "lat", { min: -90, max: 90 });
    if (lat !== undefined) {
        payload.lat = lat;
    }

    const lng = readNullableNumber(body, "lng", { min: -180, max: 180 });
    if (lng !== undefined) {
        payload.lng = lng;
    }

    if (mode === "update" && Object.keys(payload).length === 0) {
        throw new AdminApiError(400, "No valid store fields provided");
    }

    return payload;
}

export function parseStoreProductPayload(raw: unknown, mode: "create" | "update") {
    const body = ensureObject(raw);
    const payload: Record<string, unknown> = {};

    const storeId = mode === "create"
        ? readRequiredNumber(body, "store_id", { integer: true, min: 1 })
        : readOptionalNumber(body, "store_id", { integer: true, min: 1 });
    if (storeId !== undefined) {
        payload.store_id = storeId;
    }

    const globalProductId = readNullableNumber(body, "global_product_id", {
        integer: true,
        min: 1,
    });
    if (globalProductId !== undefined) {
        payload.global_product_id = globalProductId;
    } else if (mode === "create") {
        payload.global_product_id = null;
    }

    const priceOverride = readNullableNumber(body, "price_override", { min: 0 });
    if (priceOverride !== undefined) {
        payload.price_override = priceOverride;
    }

    const oldPriceOverride = readNullableNumber(body, "old_price_override", { min: 0 });
    if (oldPriceOverride !== undefined) {
        payload.old_price_override = oldPriceOverride;
    }

    const stockQuantity = readOptionalNumber(body, "stock_quantity", { integer: true, min: 0 });
    if (stockQuantity !== undefined) {
        payload.stock_quantity = stockQuantity;
    } else if (mode === "create") {
        payload.stock_quantity = 0;
    }

    const isInStock = readOptionalBoolean(body, "is_in_stock");
    if (isInStock !== undefined) {
        payload.is_in_stock = isInStock;
    } else if (mode === "create") {
        payload.is_in_stock = true;
    }

    const isActive = readOptionalBoolean(body, "is_active");
    if (isActive !== undefined) {
        payload.is_active = isActive;
    } else if (mode === "create") {
        payload.is_active = true;
    }

    const sortOrder = readOptionalNumber(body, "sort_order", { integer: true });
    if (sortOrder !== undefined) {
        payload.sort_order = sortOrder;
    } else if (mode === "create") {
        payload.sort_order = 0;
    }

    const customName = readNullableString(body, "custom_name", { maxLength: 200 });
    if (customName !== undefined) {
        payload.custom_name = customName;
    }

    const customSlug = readNullableString(body, "custom_slug", {
        maxLength: 200,
        pattern: DASH_SLUG_REGEX,
    });
    if (customSlug !== undefined) {
        payload.custom_slug = customSlug;
    } else if (mode === "create" && customName) {
        payload.custom_slug = slugifyDash(customName);
    }

    const customDescription = readNullableString(body, "custom_description", { maxLength: 5000 });
    if (customDescription !== undefined) {
        payload.custom_description = customDescription;
    }

    const customBrandName = readNullableString(body, "custom_brand_name", { maxLength: 150 });
    if (customBrandName !== undefined) {
        payload.custom_brand_name = customBrandName;
    }

    const customCategoryId = readNullableNumber(body, "custom_category_id", { integer: true, min: 1 });
    if (customCategoryId !== undefined) {
        payload.custom_category_id = customCategoryId;
    }

    const customPrice = readNullableNumber(body, "custom_price", { min: 0 });
    if (customPrice !== undefined) {
        payload.custom_price = customPrice;
    }

    const customOldPrice = readNullableNumber(body, "custom_old_price", { min: 0 });
    if (customOldPrice !== undefined) {
        payload.custom_old_price = customOldPrice;
    }

    const customWeight = readNullableString(body, "custom_weight", { maxLength: 64 });
    if (customWeight !== undefined) {
        payload.custom_weight = customWeight;
    }

    const customImageUrl = readNullableString(body, "custom_image_url", { maxLength: 2048 });
    if (customImageUrl !== undefined) {
        payload.custom_image_url = customImageUrl;
    }

    const customImages = readOptionalStringArray(body, "custom_images");
    if (customImages !== undefined) {
        payload.custom_images = customImages;
    }

    const customAttributes = readOptionalObject(body, "custom_attributes");
    if (customAttributes !== undefined) {
        payload.custom_attributes = customAttributes;
    } else if (mode === "create") {
        payload.custom_attributes = {};
    }

    const customBarcode = readNullableString(body, "custom_barcode", { maxLength: 128 });
    if (customBarcode !== undefined) {
        payload.custom_barcode = customBarcode;
    }

    if (mode === "create") {
        const finalGlobalProductId = payload.global_product_id as number | null | undefined;
        const finalCustomName = payload.custom_name as string | null | undefined;
        const finalCustomPrice = payload.custom_price as number | null | undefined;

        if (!finalGlobalProductId && (!finalCustomName || finalCustomPrice === null || finalCustomPrice === undefined)) {
            throw new AdminApiError(
                400,
                "Custom store products require custom_name and custom_price when global_product_id is null"
            );
        }
    }

    if (mode === "update" && Object.keys(payload).length === 0) {
        throw new AdminApiError(400, "No valid store product fields provided");
    }

    return payload;
}

export function parseOrderStatusPayload(raw: unknown) {
    const body = ensureObject(raw);
    if (Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, "status")) {
        throw new AdminApiError(400, "Only status can be updated for orders");
    }
    return {
        status: assertOrderStatus(body.status),
    };
}

export function assertCategoryNotSelfParent(categoryId: number, payload: Record<string, unknown>) {
    if (payload.parent_id === categoryId) {
        throw new AdminApiError(400, "Category cannot be its own parent");
    }
}
