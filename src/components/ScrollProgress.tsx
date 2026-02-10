import { motion, useScroll, useTransform } from "framer-motion";

const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-0.5 bg-primary origin-left z-50"
            style={{ scaleX }}
        />
    );
};

export default ScrollProgress;
