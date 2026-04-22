import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const FinalCta = () => (
  <section className="bg-background py-16 text-center">
    <div className="container">
      <h2 className="text-2xl font-semibold text-brand-dark md:text-3xl">Ready to do your best work?</h2>
      <p className="mt-2 text-muted-foreground">Let's get you started.</p>
      <Button variant="red" size="lg" className="mt-6" asChild>
        <Link to="/products">Sign up now</Link>
      </Button>
    </div>
  </section>
);
