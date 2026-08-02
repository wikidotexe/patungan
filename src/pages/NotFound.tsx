import { useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass glass-sheen rounded-2xl px-10 py-8 text-center">
        <h1 className="relative mb-4 text-4xl font-bold">404</h1>
        <p className="relative mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="relative text-blue-500 hover:underline">
          Return to Home
        </a>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
