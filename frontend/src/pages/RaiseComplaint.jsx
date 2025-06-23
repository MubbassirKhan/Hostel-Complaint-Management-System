import React, { useState } from "react";
import "./RaiseComplaint.css"; // Optional: For styling

const RaiseComplaint = () => {
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    sid: "", // Can be auto-filled from login/session in real app
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sample POST request
    try {
      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Complaint submitted successfully!");
        setFormData({ type: "", description: "", sid: "" });
      } else {
        alert("Failed to submit complaint.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting complaint.");
    }
  };

  return (
    <div className="complaint-form-container">
      <h2>Raise a Complaint</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Complaint Type:
          <select name="type" value={formData.type} onChange={handleChange} required>
            <option value="">-- Select Type --</option>
            <option value="Electricity">Electricity</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Description:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Describe your complaint..."
          ></textarea>
        </label>

        <label>
          Student ID (SID):
          <input
            type="text"
            name="sid"
            value={formData.sid}
            onChange={handleChange}
            placeholder="Enter your SID"
            required
          />
        </label>

        <button type="submit">Submit Complaint</button>
      </form>
    </div>
  );
};

export default RaiseComplaint;
