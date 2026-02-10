import { motion } from "framer-motion";
import { Phone, MessageSquare, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollAnimations";

const steps = [
  {
    icon: MessageSquare,
    title: "Share Preferences",
    description: "Tell us your preferred area, budget, and property type.",
    color: "from-blue-500 to-cyan-400",
    number: "01",
  },
  {
    icon: Phone,
    title: "Receive AI Call",
    description: "Our agent calls you at your preferred time to discuss listings.",
    color: "from-violet-500 to-purple-400",
    number: "02",
  },
  {
    icon: Calendar,
    title: "Schedule Visit",
    description: "Book property viewings directly during the call.",
    color: "from-emerald-500 to-teal-400",
    number: "03",
  },
  {
    icon: CheckCircle,
    title: "Find Your Home",
    description: "Visit properties and close the deal on your perfect home.",
    color: "from-amber-500 to-orange-400",
    number: "04",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 relative">
      {/* Light background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-sm font-medium text-primary">Simple Process</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Four simple steps to find your dream property
            </p>
          </div>
        </ScrollReveal>

        {/* Steps Flow */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div
                  className="relative group text-center"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="p-6 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                    {/* Step number */}
                    <span
                      className={`text-4xl font-display font-bold bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-20`}
                    >
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md my-4`}
                    >
                      <step.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="font-display text-lg font-bold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-primary/30" />
                    </div>
                  )}
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* CTA */}
        <ScrollReveal delay={0.4}>
          <div className="text-center mt-12">
            <button
              onClick={() =>
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all duration-300"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HowItWorksSection;
