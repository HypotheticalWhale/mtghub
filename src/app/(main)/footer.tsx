"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Twitch,
} from "lucide-react";

import { brand } from "@/lib/constants/brand";

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <footer className="border-t bg-background mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {brand.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {Object.entries(brand.social).map(([platform, href]) => {
              if (href !== "https://example.com") {
                return (
                  <Link
                    key={platform}
                    href={href}
                    className="text-muted-foreground hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{platform}</span>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
