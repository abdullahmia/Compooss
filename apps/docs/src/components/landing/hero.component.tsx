"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Container,
  Database,
  Download,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden pb-24 pt-20 md:pb-32 md:pt-32"
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.07] blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 top-40 h-[400px] w-[400px] rounded-full bg-teal-500/[0.05] blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-400/[0.04] blur-[100px]"
        />
      </div>

      <motion.div style={{ y: heroY, opacity: heroOpacity }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl"
            >
              Open-Source MongoDB GUI for{" "}
              <span className="animate-gradient bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                Docker Compose
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl"
            >
              A free, self-hosted MongoDB admin panel that runs as a single
              Docker container. Browse databases, query documents, manage
              indexes — no signup, no cloud, no config.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              <a
                href="#installation"
                className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
              <a
                href="https://hub.docker.com/r/abdullahmia/compooss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-7 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-white"
              >
                <Container size={16} />
                Docker Hub
              </a>
              <a
                href="#download"
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-7 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-white"
              >
                <Download size={16} />
                Desktop App
              </a>
            </motion.div>

            {/* Quick install */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 inline-flex items-center gap-3 rounded-full border border-zinc-800/60 bg-zinc-900/40 px-5 py-2.5 backdrop-blur"
            >
              <Terminal size={14} className="text-zinc-500" />
              <code className="font-mono text-sm text-zinc-300">
                docker pull abdullahmia/compooss:latest
              </code>
              <ChevronRight size={14} className="text-zinc-600" />
            </motion.div>
          </div>

          {/* Hero Preview with 3D perspective */}
          <div className="hero-preview-wrapper relative mx-auto mt-20 max-w-5xl [perspective:2000px]">
            <motion.div
              initial={{ opacity: 0, y: 60, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 2 }}
              transition={{
                duration: 1,
                delay: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative [transform-style:preserve-3d]"
            >
              {/* Multi-layer glow */}
              <div className="animate-glow-pulse absolute -inset-8 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 blur-3xl" />
              <div className="animate-glow-pulse absolute -inset-2 rounded-3xl bg-gradient-to-b from-emerald-400/10 via-transparent to-transparent blur-2xl [animation-delay:1.5s]" />

              {/* Browser chrome */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-950 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.7),0_0_40px_-15px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/80 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-zinc-800/50 px-3 py-1">
                    <ShieldCheck size={12} className="text-emerald-400/60" />
                    <span className="font-mono text-xs text-zinc-500">
                      localhost:6969 — Compooss
                    </span>
                  </div>
                </div>
                <Image
                  src="/preview.jpeg"
                  alt="Compooss MongoDB GUI screenshot — database browser, collection explorer, and document viewer running inside Docker"
                  width={1920}
                  height={1080}
                  className="w-full"
                  priority
                />
              </div>

              {/* Floating feature badges */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="absolute -left-4 top-1/4 z-10 hidden lg:block"
              >
                <div className="animate-float rounded-xl border border-zinc-700/50 bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Database size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        4 Databases
                      </p>
                      <p className="text-[10px] text-zinc-500">Connected</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute -right-4 top-1/3 z-10 hidden lg:block"
              >
                <div className="animate-float rounded-xl border border-zinc-700/50 bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur-sm [animation-delay:2s]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Zap size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        Zero Config
                      </p>
                      <p className="text-[10px] text-zinc-500">Just Docker</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="absolute -bottom-3 left-1/2 z-10 hidden -translate-x-1/2 lg:block"
              >
                <div className="flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-900/90 px-4 py-2 shadow-xl backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-medium text-zinc-300">
                    Open Source & Free Forever
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Reflection */}
            <div
              className="pointer-events-none mt-1 hidden overflow-hidden lg:block"
              style={{ height: "80px" }}
            >
              <div className="relative -scale-y-100 opacity-[0.08] blur-[2px]">
                <div className="overflow-hidden rounded-2xl border border-zinc-700/50">
                  <Image
                    src="/preview.jpeg"
                    alt=""
                    width={1920}
                    height={1080}
                    className="w-full"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
