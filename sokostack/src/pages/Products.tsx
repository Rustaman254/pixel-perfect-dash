import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { Button } from "@/components/ui/button";

const Products = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <main className="container py-24 text-center">
      <h1 className="text-4xl font-semibold text-brand-dark">Products</h1>
      <p className="mt-3 text-muted-foreground">This page is a stub. The full catalog is coming soon.</p>
      <Button variant="red" className="mt-6" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </main>
    <SiteFooter />
  </div>
);

export default Products;
