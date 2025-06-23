import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-700 w-full mt-auto">
      {/* Grid with 4 columns now */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Column 1: Logo + About */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/images/hostel-room.png"
              alt="Hostella Logo"
              className="w-10 h-10 rounded-lg border border-indigo-500 shadow"
            />
            <h3 className="text-indigo-400 text-xl font-bold">Hostella</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            A centralized government platform for managing student hostel complaints efficiently, securely, and transparently.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-indigo-400 transition">Home</Link></li>
            <li><Link to="/about" className="hover:text-indigo-400 transition">About</Link></li>
            <li><Link to="/register" className="hover:text-indigo-400 transition">Create Account</Link></li>
          </ul>
        </div>


         {/* ✅ Column 3: New Contact Info */}
         <div>
          <h4 className="text-white font-semibold mb-3">Contact Us</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-indigo-400" /> +91 74114 01697
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-indigo-400" /> support@hostella.in
            </li>
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-indigo-400 mt-1" />
              Opp. Airport, Gokul Road,<br /> Hubballi, Karnataka 580030
            </li>
          </ul>
        </div>

        {/* Column 4: Socials */}
        <div>
          <h4 className="text-white font-semibold mb-3">Follow Us</h4>
          <div className="flex space-x-4 text-lg">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition">
              <FaGithub />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-pink-500 transition">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition">
              <FaLinkedin />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition">
              <FaFacebook />
            </a>
          </div>
        </div>

       

      </div> {/* Close 4-column grid */}

      {/* ✅ Full Width Row for Map */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <h4 className="text-white font-semibold mb-4">Our Location</h4>
        <div className="w-full h-72 rounded-lg overflow-hidden shadow border border-slate-700">
          <iframe
            title="KLEIT Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3873.791844051842!2d75.07699757506134!3d15.352450285262864!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb8d6b8fd942131%3A0x67b6dbf77ee7c3cb!2sKLE%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1719058314765!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="border-t border-slate-800 py-4 text-center text-slate-500 text-xs">
        © {new Date().getFullYear()} <span className="text-indigo-400 font-semibold">Hostella</span>. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
