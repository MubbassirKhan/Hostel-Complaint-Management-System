import React from 'react';

const MapFooter = () => {
  return (
    <div className="bg-slate-900 py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <h4 className="text-white font-semibold mb-4 text-lg">Our Location</h4>
        <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg border border-slate-700">
          <iframe
            title="Hostel Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.608183826581!2d72.83725491490707!3d19.1234569876543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b123456789ab%3A0xa1b2c3d4e5f6g7h8!2sYour%20Hostel%20Location!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default MapFooter;
