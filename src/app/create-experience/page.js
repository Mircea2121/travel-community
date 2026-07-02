"use client";

import { useState } from "react";
import "./createExperience.css";

export default function CreateExperiencePage() {
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    country: "",
    city: "",
    category: "",
    travelPeriod: "",
    totalCost: "",
    tips: "",
    description: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
      alert("Poți încărca maximum 10 poze.");
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (imagePreviews.length === 0) {
      alert("Te rog să adaugi cel puțin o poză.");
      return;
    }

    console.log("Date postare:", formData);
    console.log("Poze:", imagePreviews);

    alert("Postarea a fost creată cu succes!");
  }

  return (
    <section className="create-experience-page">
      <div className="create-experience-container">
        <div className="create-experience-header">
          <span className="create-experience-badge">Comunitatea călătorilor</span>
          <h1>Adaugă o postare de călătorie</h1>
          <p>
            Spune unde ai fost, cât te-a costat, ce ponturi ai pentru alți
            călători și ce ar trebui să știe înainte să plece.
          </p>
        </div>

        <form className="experience-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titlul postării</label>
            <input
              type="text"
              name="title"
              placeholder="Exemplu: 5 zile superbe în Sardinia"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Destinație</label>
              <input
                type="text"
                name="destination"
                placeholder="Exemplu: Sardinia"
                value={formData.destination}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Țară</label>
              <input
                type="text"
                name="country"
                placeholder="Exemplu: Italia"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Oraș / Zonă</label>
              <input
                type="text"
                name="city"
                placeholder="Exemplu: Cagliari, Olbia, Costa Smeralda"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Categorie</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Alege categoria</option>
                <option value="plaja">Plajă</option>
                <option value="city-break">City break</option>
                <option value="munte">Munte</option>
                <option value="mancare">Mâncare</option>
                <option value="aventura">Aventură</option>
                <option value="cultura">Cultură</option>
                <option value="familie">Familie</option>
                <option value="buget-redus">Buget redus</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Perioada călătoriei</label>
              <input
                type="text"
                name="travelPeriod"
                placeholder="Exemplu: 26 septembrie - 2 octombrie"
                value={formData.travelPeriod}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Cost total aproximativ</label>
              <input
                type="text"
                name="totalCost"
                placeholder="Exemplu: 700€ pentru 2 persoane"
                value={formData.totalCost}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ponturi utile</label>
            <textarea
              name="tips"
              placeholder="Exemplu: unde ai mâncat bine, ce merită vizitat, ce să eviți, parcări, transport, prețuri..."
              value={formData.tips}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Povestea ta</label>
            <textarea
              name="description"
              placeholder="Scrie liber cum a fost experiența ta..."
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Poze din călătorie</label>

            <label className="image-upload-box">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <span>Apasă pentru a adăuga poze</span>
              <small>Minimum 1 poză, maximum 10 poze</small>
            </label>

            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map((image, index) => (
                  <div className="image-preview-card" key={index}>
                    <img src={image} alt={`Poză ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="submit-experience-btn">
            Publică postarea
          </button>
        </form>
      </div>
    </section>
  );
}