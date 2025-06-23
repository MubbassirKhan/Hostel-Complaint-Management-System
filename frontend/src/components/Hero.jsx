import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white min-h-[calc(100vh-64px)] flex items-center px-4 sm:px-6 md:px-10 lg:px-28 pt-16 pb-4 md:pt-20 md:pb-6 overflow-hidden">
      
      {/* 💫 Decorative Glow Circle */}
      <div className="absolute w-80 h-80 bg-indigo-700 opacity-20 rounded-full -top-20 -left-20 blur-3xl"></div>

      {/* Hero Content */}
      <div className={`z-10 max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* 🖼 Image Section */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img 
            src="/images/hostel-room.png"
            alt="Govt Hostel Room"
            className={`rounded-2xl shadow-xl border-4 border-indigo-500 max-w-full h-auto object-cover transform transition duration-500 hover:scale-105 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          />
        </div>

        {/* 📄 Text Section */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-400 leading-snug">
            Government Hostel Complaint System
          </h1>
          <p className="text-slate-300 leading-relaxed text-base sm:text-lg">
            Welcome to <span className="text-indigo-300 font-semibold">Hostella</span> — an official government platform for students to report hostel issues, track resolutions, and connect with authorities transparently.
          </p>

          <ul className="text-slate-400 list-disc pl-6 text-left text-sm sm:text-base space-y-1">
            <li>📢 Raise complaints anytime from your hostel room</li>
            <li>📊 View live complaint status & admin responses</li>
            <li>🏫 Managed directly by hostel wardens and authorities</li>
            <li>🔒 Verified by government and protected with secure login</li>
          </ul>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-4">
            <Link to="/raise-complaint" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow transition hover:shadow-xl text-center">
              Raise Complaint
            </Link>
            <Link to="/track-complaint" className="bg-slate-800 hover:bg-slate-700 text-indigo-300 px-6 py-3 rounded-lg border border-indigo-500 transition hover:shadow text-center">
              Track Status
            </Link>
            <Link to="/register" className="bg-transparent border border-slate-600 hover:border-indigo-400 text-slate-400 hover:text-white px-6 py-3 rounded-lg transition text-center">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
