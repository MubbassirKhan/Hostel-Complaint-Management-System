import React, { useEffect, useState } from 'react';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade/slide animation on mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white min-h-screen px-6 py-16 md:px-16 lg:px-32 flex items-center justify-center">
      <div className={`max-w-5xl mx-auto space-y-10 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* 🔹 Heading */}
        <div className={`text-center transform transition duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-indigo-400">About Hostella</h2>
          <p className="mt-4 text-slate-300 text-lg max-w-3xl mx-auto">
            Empowering students, streamlining hostel facilities — Hostella is your modern solution for complaint resolution.
          </p>
        </div>

        {/* 🔸 Main Content */}
        <div className="grid md:grid-cols-2 gap-10 items-center mt-10">
          {/* Image */}
          <img 
            src="/images/hostel-room.png"
            alt="Hostel Visual"
            className={`rounded-xl shadow-lg border-2 border-indigo-500 w-full transform transition duration-1000 hover:scale-105 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          />

          {/* Text */}
          <div className={`space-y-6 text-slate-300 text-base leading-relaxed transition duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <p>
              <strong className="text-indigo-300">Hostella</strong> is a government-supported digital system for hostel residents to voice issues and track resolutions transparently.
            </p>
            <p>
              The platform bridges the communication gap between students and authorities — improving infrastructure, safety, and service quality in hostels.
            </p>
            <p>
              Hostella brings 24/7 digital access and accountability to your hostel experience.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className={`grid sm:grid-cols-2 gap-6 mt-12 transition duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-slate-800 rounded-lg p-6 border border-indigo-500 hover:shadow-xl transition hover:scale-105">
            <h3 className="text-indigo-400 text-xl font-semibold mb-2">🎯 Our Mission</h3>
            <p className="text-slate-300">
              To offer a transparent platform for students to raise concerns and ensure fast resolution by hostel admins.
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-indigo-500 hover:shadow-xl transition hover:scale-105">
            <h3 className="text-indigo-400 text-xl font-semibold mb-2">🚀 Our Vision</h3>
            <p className="text-slate-300">
              To be the go-to solution for managing hostel complaints in every educational institution across the country.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
