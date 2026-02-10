import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ParallaxSectionProps {
    children: React.ReactNode;
    speed?: number;
    className?: string;
    direction?: "up" | "down";
}

export const ParallaxSection = ({
    children,
    speed = 0.3,
    className = "",
    direction = "up",
}: ParallaxSectionProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const multiplier = direction === "up" ? -1 : 1;
    const y = useTransform(scrollYProgress, [0, 1], [0, 200 * speed * multiplier]);

    return (
        <motion.div ref={ref} style={{ y }} className={className}>
            {children}
        </motion.div>
    );
};

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right";
    distance?: number;
    duration?: number;
    once?: boolean;
}

export const ScrollReveal = ({
    children,
    className = "",
    delay = 0,
    direction = "up",
    distance = 60,
    duration = 0.8,
    once = true,
}: ScrollRevealProps) => {
    const directionMap = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { y: 0, x: distance },
        right: { y: 0, x: -distance },
    };

    const { x, y } = directionMap[direction];

    return (
        <motion.div
            initial={{ opacity: 0, x, y }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once, margin: "-50px" }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

interface TextRevealProps {
    text: string;
    className?: string;
    delay?: number;
    staggerDelay?: number;
}

export const TextReveal = ({
    text,
    className = "",
    delay = 0,
    staggerDelay = 0.03,
}: TextRevealProps) => {
    const words = text.split(" ");

    return (
        <span className={className}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
                    <motion.span
                        className="inline-block"
                        initial={{ y: "100%", opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.6,
                            delay: delay + i * staggerDelay,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

interface CountUpProps {
    end: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    className?: string;
}

export const CountUp = ({
    end,
    suffix = "",
    prefix = "",
    duration = 2,
    className = "",
}: CountUpProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end center"],
    });

    const count = useTransform(scrollYProgress, [0, 1], [0, end]);

    return (
        <motion.span ref={ref} className={className}>
            {prefix}
            <motion.span>
                {useTransform(count, (v) => Math.round(v))}
            </motion.span>
            {suffix}
        </motion.span>
    );
};

interface MorphingBackgroundProps {
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "accent";
}

export const MorphingBackground = ({
    children,
    className = "",
    variant = "primary",
}: MorphingBackgroundProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

    const colorMap = {
        primary: "hsla(215, 90%, 55%, 0.15)",
        secondary: "hsla(280, 80%, 60%, 0.1)",
        accent: "hsla(170, 70%, 50%, 0.1)",
    };

    return (
        <div ref={ref} className={`relative ${className}`}>
            <motion.div
                className="absolute -inset-20 rounded-full blur-3xl pointer-events-none"
                style={{
                    scale,
                    opacity,
                    rotate,
                    background: `radial-gradient(ellipse, ${colorMap[variant]}, transparent 70%)`,
                }}
            />
            {children}
        </div>
    );
};
