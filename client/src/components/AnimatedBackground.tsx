import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: "#0B1117" }}>
      {/* Deep navy base */}
      <div className="absolute inset-0" style={{ backgroundColor: "#0B1117" }} />
      
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(150,170,185,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(150,170,185,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
          animate={{
            backgroundPosition: ["0 0", "40px 40px", "0 0"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')"
      }} />

      {/* Animated network lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" style={{ pointerEvents: "none" }}>
        <motion.line
          x1="20%"
          y1="0"
          x2="20%"
          y2="100%"
          stroke="#9AA6B2"
          strokeWidth="1"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.line
          x1="40%"
          y1="0"
          x2="40%"
          y2="100%"
          stroke="#9AA6B2"
          strokeWidth="1"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.line
          x1="60%"
          y1="0"
          x2="60%"
          y2="100%"
          stroke="#9AA6B2"
          strokeWidth="1"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.line
          x1="80%"
          y1="0"
          x2="80%"
          y2="100%"
          stroke="#9AA6B2"
          strokeWidth="1"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1="0"
            y1={`${10 + i * 12}%`}
            x2="100%"
            y2={`${10 + i * 12}%`}
            stroke="#9AA6B2"
            strokeWidth="1"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>

      {/* Animated teal accent - left */}
      <motion.div
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(47,167,160,0.08)" }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Animated teal accent - right */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(47,167,160,0.06)" }}
        animate={{
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Animated subtle accent - center */}
      <motion.div
        className="absolute top-1/2 left-1/2 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(150,170,185,0.04)" }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Floating particles */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? "rgba(47,167,160,0.4)" : "rgba(150,170,185,0.3)",
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0, 1, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Animated geometric shapes */}
      <motion.div
        className="absolute right-1/4 top-1/4 h-24 w-24"
        style={{
          border: "1px solid rgba(47,167,160,0.15)",
          borderRadius: "12px",
          transform: "rotate(45deg)",
        }}
        animate={{
          rotate: [45, 225, 45],
          scale: [1, 1.08, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute left-1/4 bottom-1/4 h-20 w-20 rounded-full"
        style={{
          border: "1px solid rgba(150,170,185,0.15)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      
      <motion.div
        className="absolute right-1/3 bottom-1/3 h-16 w-16"
        style={{
          border: "1px solid rgba(47,167,160,0.15)",
          borderRadius: "8px",
          transform: "rotate(30deg)",
        }}
        animate={{
          rotate: [30, 210, 30],
          y: [0, -15, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />

      {/* Scanning line */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(47,167,160,0.04), transparent)",
        }}
        animate={{
          y: ["-100%", "100%"],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Secondary scan line - horizontal */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to right, transparent, rgba(150,170,185,0.03), transparent)",
        }}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
          delay: 6,
        }}
      />
    </div>
  );
}
