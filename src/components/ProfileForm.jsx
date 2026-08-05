import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileForm({ isEditing = false, onCancel = null, hideCancel = false }) {
  const { profile, updateProfile, signOut } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    state: profile?.state || '',
    category: profile?.category || 'General',
    income_range: profile?.income_range || 'Below ₹50,000',
    age: profile?.age || '',
    family_size: profile?.family_size || '',
    preferred_language: profile?.preferred_language || 'Hindi',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateProfile(formData);
      if (isEditing && onCancel) {
        onCancel();
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>{isEditing ? 'Edit Profile' : 'Complete Your Profile'}</h2>
      {!isEditing && <p>We need a few details to provide you with the best guidance.</p>}
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="large-input"
            placeholder="e.g. Ramesh Kumar"
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            id="age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            required
            className="large-input"
            min="1"
            max="120"
          />
        </div>

        <div className="form-group">
          <label htmlFor="state">State</label>
          <select 
            id="state" 
            name="state" 
            value={formData.state} 
            onChange={handleChange} 
            required 
            className="large-input"
          >
            <option value="">Select your state</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Goa">Goa</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Manipur">Manipur</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Tripura">Tripura</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select 
            id="category" 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            className="large-input"
          >
            <option value="General">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="income_range">Annual Family Income</label>
          <select 
            id="income_range" 
            name="income_range" 
            value={formData.income_range} 
            onChange={handleChange} 
            className="large-input"
          >
            <option value="Below ₹50,000">Below ₹50,000</option>
            <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
            <option value="₹1,00,000 - ₹2,50,000">₹1,00,000 - ₹2,50,000</option>
            <option value="₹2,50,000 - ₹5,00,000">₹2,50,000 - ₹5,00,000</option>
            <option value="Above ₹5,00,000">Above ₹5,00,000</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="family_size">Family Size</label>
          <input
            id="family_size"
            name="family_size"
            type="number"
            value={formData.family_size}
            onChange={handleChange}
            required
            className="large-input"
            min="1"
            max="20"
          />
        </div>

        <div className="form-group">
          <label htmlFor="preferred_language">Preferred Language</label>
          <select 
            id="preferred_language" 
            name="preferred_language" 
            value={formData.preferred_language} 
            onChange={handleChange} 
            className="large-input"
          >
            <option value="Hindi">Hindi</option>
            <option value="Marathi">Marathi</option>
            <option value="English">English</option>
          </select>
        </div>

        <div className="button-group" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          {isEditing && !hideCancel && (
            <button type="button" className="secondary-btn" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
      
      {!isEditing && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button type="button" className="text-btn" onClick={signOut}>
            Logout instead
          </button>
        </div>
      )}
    </div>
  );
}
