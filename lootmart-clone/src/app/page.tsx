import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ShieldCheck, Truck, Star, ChevronRight, Zap, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import AreaModalWrapper from "@/components/AreaModalWrapper";
import { areas, stores, parentCategories, getSubcategories } from "@/lib/data";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-amber-50 to-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                Delivery in Minutes
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-5xl">
                Groceries delivered{" "}
                <span className="text-primary">faster</span> than you think
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Order from your favorite local stores and get fresh groceries delivered to your doorstep in minutes. Quality guaranteed.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/store/hash-mart"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  <Package className="h-4 w-4" />
                  Start Shopping
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-primary/5 hover:border-primary/40">
                  <MapPin className="h-4 w-4 text-primary" />
                  Choose Area
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>30 min delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Quality guaranteed</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 text-green-500" />
                  <span>Free delivery</span>
                </div>
              </div>
            </div>

            {/* Hero illustration - category grid */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative grid grid-cols-3 gap-3">
                  {parentCategories.map((cat, i) => (
                    <div
                      key={cat.id}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-1"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-primary/5">
                        {cat.image_url && (
                          <Image
                            src={cat.image_url}
                            alt={cat.name}
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground text-center">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Areas */}
      <section className="py-16 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Available Areas
            </h2>
            <p className="mt-2 text-muted-foreground">
              Choose your delivery area to start shopping
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {areas.map((area) => {
              const areaStore = stores.find((s) => s.areas.includes(area.id));
              return (
                <Link
                  key={area.id}
                  href={areaStore ? `/store/${areaStore.slug}` : "#"}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white p-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {area.name}
                      </span>
                      <p className="text-xs text-muted-foreground">{area.city}</p>
                    </div>
                  </div>
                  {areaStore && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {areaStore.name} available
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      <section className="py-16 sm:py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Browse Categories
            </h2>
            <p className="mt-2 text-muted-foreground">
              Explore our wide range of products
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {parentCategories.map((cat) => {
              const subs = getSubcategories(cat.id);
              return (
                <Link
                  key={cat.id}
                  href={`/store/hash-mart?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-primary/5 sm:h-24 sm:w-24">
                    {cat.image_url && (
                      <Image
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subs.length} subcategories
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      <section className="py-16 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Featured Stores
            </h2>
            <p className="mt-2 text-muted-foreground">
              Shop from trusted local stores
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stores.map((store) => {
              const storeAreas = areas.filter((a) => store.areas.includes(a.id));
              return (
                <Link
                  key={store.id}
                  href={`/store/${store.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-white transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  {/* Store Header */}
                  <div className="relative h-32 bg-gradient-to-br from-primary/10 via-amber-50 to-primary/5 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md border border-border">
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">4.8</span>
                          <span className="text-xs text-muted-foreground">(200+ orders)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Open
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {storeAreas.map((area) => (
                        <span
                          key={area.id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-xs text-primary"
                        >
                          <MapPin className="h-3 w-3" />
                          {area.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>25-35 min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        <span>Free delivery</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get your groceries in 3 easy steps
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Select Your Area",
                description: "Choose your delivery area to see available stores near you.",
                icon: MapPin,
                color: "bg-blue-50 text-blue-600",
              },
              {
                step: "2",
                title: "Add to Cart",
                description: "Browse products and add your favorites to the cart.",
                icon: Package,
                color: "bg-primary/10 text-primary",
              },
              {
                step: "3",
                title: "Get It Delivered",
                description: "Place your order and get it delivered in minutes.",
                icon: Truck,
                color: "bg-green-50 text-green-600",
              },
            ].map((item) => (
              <div key={item.step} className="group flex flex-col items-center text-center p-6 rounded-xl transition-all hover:bg-primary/5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} mb-4`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                  Step {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppBubble />
      <AreaModalWrapper />
    </div>
  );
}
