"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "./createExperience.css";
import FlagBackground from "../components/flagBackground/flagBackground";

const INITIAL_FORM_DATA = {
  title: "",
  destination: "",
  country: "",
  city: "",
  category: "",
  travelPeriod: "",
  totalCost: "",
  tips: "",
  description: "",
};

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function CreateExperiencePage() {
  const router = useRouter();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (formMessage.text) {
      setFormMessage({
        type: "",
        text: "",
      });
    }
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    setFormMessage({
      type: "",
      text: "",
    });

    if (files.length === 0) {
      return;
    }

    if (files.length > MAX_IMAGES) {
      setFormMessage({
        type: "error",
        text: `Poți încărca maximum ${MAX_IMAGES} poze.`,
      });

      event.target.value = "";
      return;
    }

    const invalidTypeImage = files.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
    );

    if (invalidTypeImage) {
      setFormMessage({
        type: "error",
        text: "Sunt acceptate doar imagini JPG, PNG sau WEBP.",
      });

      event.target.value = "";
      return;
    }

    const oversizedImage = files.find(
      (file) => file.size > MAX_IMAGE_SIZE
    );

    if (oversizedImage) {
      setFormMessage({
        type: "error",
        text: "Fiecare imagine trebuie să aibă maximum 10 MB.",
      });

      event.target.value = "";
      return;
    }

    imagePreviews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    const newPreviews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setSelectedImages(files);
    setImagePreviews(newPreviews);
  }

  function removeImage(imageIndex) {
    const previewToRemove = imagePreviews[imageIndex];

    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove);
    }

    setSelectedImages((previousImages) =>
      previousImages.filter((_, index) => index !== imageIndex)
    );

    setImagePreviews((previousPreviews) =>
      previousPreviews.filter((_, index) => index !== imageIndex)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (selectedImages.length === 0) {
      setFormMessage({
        type: "error",
        text: "Te rog să adaugi cel puțin o poză.",
      });

      return;
    }

    setIsSubmitting(true);

    setFormMessage({
      type: "",
      text: "",
    });

    try {
      const requestFormData = new FormData();

      Object.entries(formData).forEach(([fieldName, fieldValue]) => {
        requestFormData.append(fieldName, fieldValue);
      });

      selectedImages.forEach((image) => {
        requestFormData.append("images", image);
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        body: requestFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Postarea nu a putut fi publicată."
        );
      }

      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });

      setFormData(INITIAL_FORM_DATA);
      setSelectedImages([]);
      setImagePreviews([]);

      setFormMessage({
        type: "success",
        text: data.message || "Postarea a fost publicată cu succes.",
      });

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1000);
    } catch (error) {
      setFormMessage({
        type: "error",
        text:
          error.message ||
          "A apărut o eroare. Încearcă din nou.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="create-experience-page">
      <FlagBackground />

      <div className="create-experience-container">
        <div className="create-experience-header">
          <span className="create-experience-badge">
            Comunitatea călătorilor
          </span>

          <h1>Adaugă o postare de călătorie</h1>

          <p>
            Spune unde ai fost, cât te-a costat, ce ponturi ai pentru alți
            călători și ce ar trebui să știe înainte să plece.
          </p>
        </div>

        <form
          className="experience-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="title">Titlul postării</label>

            <input
              id="title"
              type="text"
              name="title"
              placeholder="Exemplu: 5 zile superbe în Sardinia"
              value={formData.title}
              onChange={handleChange}
              minLength={5}
              maxLength={120}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="destination">Destinație</label>

              <input
                id="destination"
                type="text"
                name="destination"
                placeholder="Exemplu: Sardinia"
                value={formData.destination}
                onChange={handleChange}
                maxLength={100}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Țară</label>

              <input
                id="country"
                type="text"
                name="country"
                placeholder="Exemplu: Italia"
                value={formData.country}
                onChange={handleChange}
                maxLength={80}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Oraș / Zonă</label>

              <input
                id="city"
                type="text"
                name="city"
                placeholder="Exemplu: Cagliari, Olbia, Costa Smeralda"
                value={formData.city}
                onChange={handleChange}
                maxLength={120}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Categorie</label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isSubmitting}
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
              <label htmlFor="travelPeriod">
                Perioada călătoriei
              </label>

              <input
                id="travelPeriod"
                type="text"
                name="travelPeriod"
                placeholder="Exemplu: 26 septembrie - 2 octombrie"
                value={formData.travelPeriod}
                onChange={handleChange}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalCost">
                Cost total aproximativ
              </label>

              <input
                id="totalCost"
                type="text"
                name="totalCost"
                placeholder="Exemplu: 700€ pentru 2 persoane"
                value={formData.totalCost}
                onChange={handleChange}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tips">Ponturi utile</label>

            <textarea
              id="tips"
              name="tips"
              placeholder="Exemplu: unde ai mâncat bine, ce merită vizitat, ce să eviți, parcări, transport, prețuri..."
              value={formData.tips}
              onChange={handleChange}
              minLength={10}
              maxLength={3000}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Povestea ta</label>

            <textarea
              id="description"
              name="description"
              placeholder="Scrie liber cum a fost experiența ta..."
              value={formData.description}
              onChange={handleChange}
              minLength={20}
              maxLength={10000}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label>Poze din călătorie</label>

            <label
              className={`image-upload-box ${
                isSubmitting ? "image-upload-box-disabled" : ""
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                disabled={isSubmitting}
              />

              <span>Apasă pentru a adăuga poze</span>

              <small>
                Minimum 1 poză, maximum 10 poze, maximum 10 MB fiecare
              </small>
            </label>

            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map((image, index) => (
                  <div
                    className="image-preview-card"
                    key={image}
                  >
                    <img
                      src={image}
                      alt={`Previzualizare poză ${index + 1}`}
                    />

                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      aria-label={`Șterge poza ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formMessage.text && (
            <div
              className={`experience-form-message ${
                formMessage.type === "success"
                  ? "experience-form-message-success"
                  : "experience-form-message-error"
              }`}
              role="alert"
            >
              {formMessage.text}
            </div>
          )}

          <button
            type="submit"
            className="submit-experience-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Se publică postarea..."
              : "Publică postarea"}
          </button>
        </form>
      </div>
    </section>
  );
}