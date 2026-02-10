"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Package,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { stores, parentCategories, getSubcategories, sampleProducts, type Product, type Category } from "@/lib/data";
import Header from "@/components/Header";
import WhatsAppBubble from "@/components/WhatsAppBubble";

interface CartItem extends Product {
  quantity: number;
}

export default function StorePageClient({ slug }: { slug: string }) {
  const store = stores.find((s) => s.slug === slug) || stores[0];

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = sampleProducts;

    if (searchQuery) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (selectedSubcategory) {
      products = products.filter((p) => p.category_id === selectedSubcategory);
    } else if (selectedCategory) {
      const subcatIds = getSubcategories(selectedCategory).map((s) => s.id);
      products = products.filter((p) => subcatIds.includes(p.category_id));
    }

    return products;
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  // Cart functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const deleteFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const getCartQuantity = (productId: number) => {
    return cart.find((item) => item.id === productId)?.quantity || 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const currentSubcategories = selectedCategory ? getSubcategories(selectedCategory) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Store Header Bar */}
      <div className="sticky top-16 z-30 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <div className="flex items-center gap-2 border-l pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">{store.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    4.8
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    25-35 min
                  </span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="ml-auto flex flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }
                }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Category Toggle */}
      <div className="lg:hidden border-b bg-white px-4 py-2">
        <button
          onClick={() => setShowMobileCategories(!showMobileCategories)}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">
            {selectedCategory
              ? parentCategories.find((c) => c.id === selectedCategory)?.name || "All Categories"
              : "All Categories"}
          </span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showMobileCategories ? "rotate-90" : ""}`} />
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Category Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-[8.5rem]">
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setSearchQuery("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    !selectedCategory && !searchQuery
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  All Products
                </button>

                {parentCategories.map((cat) => (
                  <div key={cat.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSubcategory(null);
                        setSearchQuery("");
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="relative h-6 w-6 overflow-hidden rounded">
                        {cat.image_url && (
                          <Image src={cat.image_url} alt={cat.name} fill className="object-contain" unoptimized />
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>

                    {/* Subcategories */}
                    {selectedCategory === cat.id && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                        {getSubcategories(cat.id).map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategory(sub.id)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                              selectedSubcategory === sub.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Mobile Categories Overlay */}
          {showMobileCategories && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileCategories(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
                <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
                  <h2 className="font-semibold text-foreground">Categories</h2>
                  <button onClick={() => setShowMobileCategories(false)}>
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <nav className="p-3 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setShowMobileCategories(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      !selectedCategory ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    All Products
                  </button>
                  {parentCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSubcategory(null);
                        setShowMobileCategories(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        selectedCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      <div className="relative h-6 w-6 overflow-hidden rounded">
                        {cat.image_url && (
                          <Image src={cat.image_url} alt={cat.name} fill className="object-contain" unoptimized />
                        )}
                      </div>
                      {cat.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {/* Subcategory chips */}
            {selectedCategory && currentSubcategories.length > 0 && !searchQuery && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    !selectedSubcategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  All
                </button>
                {currentSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedSubcategory === sub.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-primary/10"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? (
                  <>Showing {filteredProducts.length} results for &ldquo;{searchQuery}&rdquo;</>
                ) : (
                  <>{filteredProducts.length} products</>
                )}
              </p>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => {
                  const qty = getCartQuantity(product.id);
                  const discount = product.original_price
                    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                    : 0;

                  return (
                    <div
                      key={product.id}
                      className={`group relative rounded-xl border bg-white transition-all hover:shadow-md ${
                        !product.in_stock ? "opacity-60" : "border-border hover:border-primary/30"
                      }`}
                    >
                      {/* Discount badge */}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">
                          -{discount}%
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-50">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-contain p-4"
                          unoptimized
                        />
                        {!product.in_stock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-muted-foreground">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{product.unit}</p>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-foreground">
                              Rs. {product.price}
                            </span>
                            {product.original_price && (
                              <span className="text-xs text-muted-foreground line-through">
                                Rs. {product.original_price}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add to cart */}
                        <div className="mt-2">
                          {product.in_stock ? (
                            qty === 0 ? (
                              <button
                                onClick={() => addToCart(product)}
                                className="flex w-full items-center justify-center gap-1 rounded-lg border border-primary bg-primary/5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 py-0.5 px-1">
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-sm font-semibold text-primary">{qty}</span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-xs text-muted-foreground">
                              Unavailable
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or browse different categories
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {totalItems} items
                </span>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Your cart is empty</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add some products to get started
                  </p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          Rs. {item.price * item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteFromCart(item.id)}
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t bg-white p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Rs. {totalPrice}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">Rs. {totalPrice}</span>
                </div>
                <button className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Checkout — Rs. {totalPrice}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Bar (Mobile) */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white p-3 shadow-lg lg:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>{totalItems} items</span>
            </div>
            <span className="font-bold">Rs. {totalPrice}</span>
          </button>
        </div>
      )}

      <WhatsAppBubble />
    </div>
  );
}
