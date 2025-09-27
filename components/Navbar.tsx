"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { FaBars, FaTimes } from "react-icons/fa"

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-md shadow-md text-white px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 relative rounded-lg overflow-hidden group-hover:scale-110 transition-transform duration-300">
            <Image
              src="/snack.png"
              alt="Plotter Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
            Plotter
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300"
          >
            About
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-300 hover:text-green-400 transition-colors duration-300"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 bg-black/70 backdrop-blur-md rounded-lg p-4 shadow-lg animate-slideDown">
          <Link
            href="/"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-gray-300 hover:text-green-400 transition-colors duration-300"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </nav>
  )
}
