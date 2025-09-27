
// components/Footer.tsx
'use client';

import { FaGithub, FaLinkedin, FaGlobe } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-8 px-6 border-t border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Texto minimalista */}
        <p className="text-sm md:text-base transition-colors duration-300 hover:text-green-400">
          © 2025 Plotter - Movie reviews platform
        </p>

        {/* Links a tus perfiles */}
        <div className="flex gap-6">
          <a
            href="https://ian-pontorno-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-1"
          >
            <FaGlobe /> Portfolio
          </a>
          <a
            href="https://github.com/Ian9Franco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-1"
          >
            <FaGithub /> GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/ian-franco-collada-pontorno/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-1"
          >
            <FaLinkedin /> LinkedIn
          </a>
        </div>
      </div>

{/* Pequeña animación de desplazamiento */}
<div className="mt-6 w-full h-1 bg-gray-800 relative overflow-hidden rounded-full">
  <div className="absolute top-0 left-0 w-1/4 h-full bg-green-400 animate-slideBar"></div>
</div>


<style jsx>{`
  @keyframes slideBar {
    0% {
      left: 0%;
    }
    50% {
      left: 75%;
    }
    100% {
      left: 0%;
    }
  }

  .animate-slideBar {
    animation: slideBar 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;

  }
`}</style>


    </footer>
  );
}
