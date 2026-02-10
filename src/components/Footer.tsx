import { Link } from "react-router-dom";
import { Building2, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowUpRight, Heart } from "lucide-react";
import { ScrollReveal } from "./ScrollAnimations";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Properties", href: "#properties" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Request Call", href: "#contact" },
    { name: "Admin", href: "/auth", isRoute: true },
  ];

  const services = [
    "AI Call Agent",
    "Property Search",
    "Virtual Tours",
    "Investment Advisory",
  ];

  const socials = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-4 py-14 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <ScrollReveal>
            <div className="space-y-4">
              <a href="#" className="flex items-center gap-2.5 group w-fit">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold gradient-text">
                  AI Estate
                </span>
              </a>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Your intelligent real estate partner. Let our AI agent connect you with your dream property.
              </p>
              <div className="flex items-center gap-2">
                {socials.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-muted-foreground"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Links */}
          <ScrollReveal delay={0.1}>
            <div>
              <h4 className="font-display text-base font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    {link.isRoute ? (
                      <Link to={link.href} className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.name}
                      </Link>
                    ) : (
                      <a href={link.href} className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Services */}
          <ScrollReveal delay={0.2}>
            <div>
              <h4 className="font-display text-base font-semibold mb-4">Services</h4>
              <ul className="space-y-2.5">
                {services.map((service) => (
                  <li key={service} className="text-muted-foreground text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Contact */}
          <ScrollReveal delay={0.3}>
            <div>
              <h4 className="font-display text-base font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  hello@aiestateagent.in
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Tower A, Bandra Kurla Complex<br />Mumbai, Maharashtra 400051</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            © {currentYear} AI Estate Agent. Made with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> in India
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <button
              onClick={scrollToTop}
              className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
              aria-label="Back to top"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
