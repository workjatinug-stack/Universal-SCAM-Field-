import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedBackground() {
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Simplified mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll transforms
  const translateY1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const translateY2 = useTransform(scrollY, [0, 1000], [0, -100]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: "#05080a" }}>
      {/* Base background */}
      <div className="absolute inset-0" style={{ backgroundColor: "#05080a" }} />
      
      {/* Deep space gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0, 30, 60, 0.3) 0%, transparent 60%)",
        }}
      />

      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 200, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 200, 255, 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          y: translateY1,
        }}
        animate={{
          backgroundPosition: ["0 0", "60px 60px", "0 0"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Neural network nodes */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 2}px`,
            height: `${Math.random() * 3 + 2}px`,
            backgroundColor: "rgba(0, 200, 255, 0.4)",
            filter: "blur(2px)",
            x: mousePosition.x * 0.5,
            y: mousePosition.y * 0.5,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            backgroundColor: i % 5 === 0 ? "rgba(0, 200, 255, 0.4)" : "rgba(255, 255, 255, 0.2)",
            x: mousePosition.x * 0.3,
            y: mousePosition.y * 0.3,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 1, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-3xl"
        style={{ 
          backgroundColor: "rgba(0, 200, 255, 0.08)",
          x: mousePosition.x * 2,
          y: mousePosition.y * 2,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full blur-3xl"
        style={{ 
          backgroundColor: "rgba(0, 100, 200, 0.06)",
          x: mousePosition.x * -1.5,
          y: mousePosition.y * -1.5,
        }}
        animate={{
          scale: [1, 0.95, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Scanning beam */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(0, 200, 255, 0.03), transparent)",
        }}
        animate={{
          y: ["-100%", "100%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* AI status indicator */}
      <div className="absolute top-4 right-4 opacity-30">
        <motion.div
          className="text-[10px] font-mono"
          style={{ color: "rgba(0, 200, 255, 0.6)" }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          SENTRA ACTIVE
        </motion.div>
      </div>
    </div>
  );
}