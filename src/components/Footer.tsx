import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Blog", href: "/blog" },
    ],
    products: [
      { name: "Knitwear", href: "/products/knitwear" },
      { name: "Fabrics", href: "/products/fabrics" },
      { name: "Custom Orders", href: "/products/custom" },
      { name: "Wholesale", href: "/products/wholesale" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api" },
      { name: "Status", href: "/status" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR", href: "/gdpr" },
    ],
  };

  return (
    <footer className="border-t-2  bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground font-bold">
              &copy; {new Date().getFullYear()} Aarkay Techno Consultants Pvt.
              Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
