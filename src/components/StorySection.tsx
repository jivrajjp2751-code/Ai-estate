import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollAnimations";
import { Building2, Sparkles, Phone, Brain, Shield, Zap } from "lucide-react";

const storyCards = [
    {
        icon: Brain,
        tagline: "Intelligent Matching",
        title: "AI That Understands You",
        description:
            "Our advanced AI analyzes your preferences, lifestyle, and budget to find properties that feel like home.",
        color: "from-blue-500 to-cyan-400",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
    },
    {
        icon: Phone,
        tagline: "Personalized Calls",
        title: "Conversations, Not Chatbots",
        description:
            "Experience natural voice calls where our AI discusses properties and schedules viewings at your preferred time.",
        color: "from-violet-500 to-purple-400",
        iconBg: "bg-violet-50",
        iconColor: "text-violet-500",
    },
    {
        icon: Shield,
        tagline: "Verified Listings",
        title: "Every Property, Verified",
        description:
            "Each listing is personally verified — no surprises, no hidden costs. What you see is what you get.",
        color: "from-emerald-500 to-teal-400",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
    },
    {
        icon: Zap,
        tagline: "Lightning Fast",
        title: "From Search to Keys",
        description:
            "Our streamlined process cuts the average home-buying timeline in half with AI-powered efficiency.",
        color: "from-amber-500 to-orange-400",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
    },
];

const StorySection = () => {
    return (
        <section id="story" className="py-20 md:py-28 relative">
            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <ScrollReveal>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Why Choose Us</span>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.1}>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
                            Real Estate,{" "}
                            <span className="gradient-text">Reimagined by AI</span>
                        </h2>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            We're building the future of how people find their dream homes.
                        </p>
                    </ScrollReveal>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {storyCards.map((card, index) => (
                        <ScrollReveal key={index} delay={index * 0.1}>
                            <motion.div
                                className="group p-6 rounded-2xl bg-white border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                                whileHover={{ y: -4 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div
                                        className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
                                    >
                                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span
                                            className={`text-xs font-semibold uppercase tracking-wider ${card.iconColor} mb-1 block`}
                                        >
                                            {card.tagline}
                                        </span>
                                        <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Bottom badge */}
                <ScrollReveal delay={0.3} className="mt-12 flex justify-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-border shadow-sm">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                            Trusted by <span className="gradient-text font-bold">500+</span> homeowners
                        </span>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default StorySection;
