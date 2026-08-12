"use client";

/* eslint-disable @next/next/no-img-element -- Preview al imaginii existente în editor, cu sursă și dimensiuni variabile. Preview local blob al imaginii noi înainte de upload. */

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  LoaderCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import "./editPost.css";

const MAX_IMAGES = 10;

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

function getImageUrl(image) {
  if (typeof image === "string") {
    return image;
  }

  return image?.url || "";
}

function getImageKey(image, index) {
  if (typeof image === "string") {
    return `${image}-${index}`;
  }

  return image?.publicId || image?.url || index;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const postId = params?.id;

  const [formData, setFormData] = useState(
    INITIAL_FORM_DATA
  );

  const [existingImages, setExistingImages] =
    useState([]);

  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      if (!postId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/posts/${postId}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Postarea nu a putut fi încărcată."
          );
        }

        if (!isMounted) {
          return;
        }

        const post = data.post;

        setFormData({
          title: post?.title || "",
          destination: post?.destination || "",
          country: post?.country || "",
          city: post?.city || "",
          category: post?.category || "",
          travelPeriod: post?.travelPeriod || "",
          totalCost: post?.totalCost || "",
          tips: post?.tips || "",
          description: post?.description || "",
        });

        setExistingImages(
          Array.isArray(post?.images)
            ? post.images
            : []
        );
      } catch (loadError) {
        console.error(
          "Eroare la încărcarea postării:",
          loadError
        );

        if (!isMounted) {
          return;
        }

        setError(
          loadError?.message ||
            "Postarea nu a putut fi încărcată."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [newImagePreviews]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function handleSelectImages(event) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const currentImagesCount =
      existingImages.length + newImages.length;

    const availablePlaces =
      MAX_IMAGES - currentImagesCount;

    if (availablePlaces <= 0) {
      setError(
        `Poți păstra maximum ${MAX_IMAGES} imagini.`
      );

      event.target.value = "";
      return;
    }

    const acceptedFiles = selectedFiles.slice(
      0,
      availablePlaces
    );

    const invalidFile = acceptedFiles.find(
      (file) =>
        ![
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ].includes(file.type)
    );

    if (invalidFile) {
      setError(
        "Sunt acceptate doar imagini JPG, PNG sau WEBP."
      );

      event.target.value = "";
      return;
    }

    const oversizedFile = acceptedFiles.find(
      (file) => file.size > 10 * 1024 * 1024
    );

    if (oversizedFile) {
      setError(
        "Fiecare imagine trebuie să aibă maximum 10 MB."
      );

      event.target.value = "";
      return;
    }

    const previews = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setNewImages((currentImages) => [
      ...currentImages,
      ...acceptedFiles,
    ]);

    setNewImagePreviews((currentPreviews) => [
      ...currentPreviews,
      ...previews,
    ]);

    setError("");
    setSuccessMessage("");

    event.target.value = "";
  }

  function removeExistingImage(imageIndex) {
    setExistingImages((currentImages) =>
      currentImages.filter(
        (_, index) => index !== imageIndex
      )
    );

    setError("");
    setSuccessMessage("");
  }

  function removeNewImage(imageIndex) {
    setNewImages((currentImages) =>
      currentImages.filter(
        (_, index) => index !== imageIndex
      )
    );

    setNewImagePreviews((currentPreviews) => {
      const previewToRemove =
        currentPreviews[imageIndex];

      if (previewToRemove) {
        URL.revokeObjectURL(previewToRemove);
      }

      return currentPreviews.filter(
        (_, index) => index !== imageIndex
      );
    });

    setError("");
    setSuccessMessage("");
  }

  function validateForm() {
    if (formData.title.trim().length < 5) {
      return "Titlul trebuie să conțină cel puțin 5 caractere.";
    }

    if (!formData.destination.trim()) {
      return "Destinația este obligatorie.";
    }

    if (!formData.country.trim()) {
      return "Țara este obligatorie.";
    }

    if (!formData.category) {
      return "Selectează o categorie.";
    }

    if (formData.tips.trim().length < 10) {
      return "Ponturile trebuie să conțină cel puțin 10 caractere.";
    }

    if (formData.description.trim().length < 20) {
      return "Povestea trebuie să conțină cel puțin 20 de caractere.";
    }

    if (
      existingImages.length + newImages.length ===
      0
    ) {
      return "Postarea trebuie să conțină cel puțin o imagine.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!postId || saving) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const requestData = new FormData();

      Object.entries(formData).forEach(
        ([fieldName, fieldValue]) => {
          requestData.append(
            fieldName,
            fieldValue.trim()
          );
        }
      );

      requestData.append(
        "existingImages",
        JSON.stringify(existingImages)
      );

      newImages.forEach((image) => {
        requestData.append("images", image);
      });

      const response = await fetch(
        `/api/posts/${postId}`,
        {
          method: "PATCH",
          credentials: "include",
          body: requestData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Postarea nu a putut fi actualizată."
        );
      }

      setSuccessMessage(
        "Postarea a fost actualizată cu succes."
      );

      router.push(`/posts/${postId}`);
      router.refresh();
    } catch (saveError) {
      console.error(
        "Eroare la editarea postării:",
        saveError
      );

      setError(
        saveError?.message ||
          "Postarea nu a putut fi actualizată."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="edit-post-page">
        <div className="edit-post-status">
          <LoaderCircle
            className="edit-post-spinner"
            size={32}
          />

          <h1>Se încarcă postarea...</h1>
        </div>
      </main>
    );
  }

  if (error && !formData.title) {
    return (
      <main className="edit-post-page">
        <div className="edit-post-status">
          <h1>Postarea nu poate fi editată</h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => router.back()}
          >
            Înapoi
          </button>
        </div>
      </main>
    );
  }

  const totalImages =
    existingImages.length + newImages.length;

  return (
    <main className="edit-post-page">
      <div className="edit-post-container">
        <div className="edit-post-header">
          <button
            type="button"
            className="edit-post-back"
            onClick={() => router.back()}
            disabled={saving}
          >
            <ArrowLeft size={19} />
            Înapoi
          </button>

          <div>
            <span>Editare experiență</span>

            <h1>Actualizează postarea</h1>

            <p>
              Modifică informațiile și imaginile
              experienței tale.
            </p>
          </div>
        </div>

        <form
          className="edit-post-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              className="edit-post-message edit-post-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div className="edit-post-message edit-post-success">
              {successMessage}
            </div>
          )}

          <section className="edit-post-section">
            <div className="edit-post-section-heading">
              <div>
                <span>Informații principale</span>
                <h2>Despre călătorie</h2>
              </div>
            </div>

            <div className="edit-post-fields">
              <label className="edit-post-field edit-post-field-full">
                <span>Titlul postării *</span>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="Ex: 5 zile în Mallorca"
                  disabled={saving}
                />
              </label>

              <label className="edit-post-field">
                <span>Destinația *</span>

                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Ex: Mallorca"
                  disabled={saving}
                />
              </label>

              <label className="edit-post-field">
                <span>Țara *</span>

                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  maxLength={80}
                  placeholder="Ex: Spania"
                  disabled={saving}
                />
              </label>

              <label className="edit-post-field">
                <span>Orașul sau zona</span>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="Ex: Palma"
                  disabled={saving}
                />
              </label>

              <label className="edit-post-field">
                <span>Categoria *</span>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Selectează categoria
                  </option>

                  <option value="plaja">
                    Plajă
                  </option>

                  <option value="city-break">
                    City break
                  </option>

                  <option value="munte">
                    Munte
                  </option>

                  <option value="mancare">
                    Mâncare
                  </option>

                  <option value="aventura">
                    Aventură
                  </option>

                  <option value="cultura">
                    Cultură
                  </option>

                  <option value="familie">
                    Familie
                  </option>

                  <option value="buget-redus">
                    Buget redus
                  </option>
                </select>
              </label>

              <label className="edit-post-field">
                <span>Perioada călătoriei</span>

                <input
                  type="text"
                  name="travelPeriod"
                  value={formData.travelPeriod}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Ex: 10–15 iulie 2026"
                  disabled={saving}
                />
              </label>

              <label className="edit-post-field">
                <span>Costul total</span>

                <input
                  type="text"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Ex: 850€"
                  disabled={saving}
                />
              </label>
            </div>
          </section>

          <section className="edit-post-section">
            <div className="edit-post-section-heading">
              <div>
                <span>Galerie</span>

                <h2>Imaginile postării</h2>

                <p>
                  {totalImages} din {MAX_IMAGES} imagini
                </p>
              </div>

              <button
                type="button"
                className="edit-post-add-images"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  saving ||
                  totalImages >= MAX_IMAGES
                }
              >
                <ImagePlus size={19} />
                Adaugă imagini
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleSelectImages}
              />
            </div>

            <div className="edit-post-images">
              {existingImages.map(
                (image, index) => {
                  const imageUrl =
                    getImageUrl(image);

                  if (!imageUrl) {
                    return null;
                  }

                  return (
                    <div
                      className="edit-post-image-card"
                      key={getImageKey(
                        image,
                        index
                      )}
                    >
                      <img
                        src={imageUrl}
                        alt={`Imagine existentă ${
                          index + 1
                        }`}
                      />

                      <span className="edit-post-image-label">
                        Existentă
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeExistingImage(index)
                        }
                        disabled={saving}
                        aria-label="Elimină imaginea"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                }
              )}

              {newImagePreviews.map(
                (preview, index) => (
                  <div
                    className="edit-post-image-card"
                    key={`${preview}-${index}`}
                  >
                    <img
                      src={preview}
                      alt={`Imagine nouă ${
                        index + 1
                      }`}
                    />

                    <span className="edit-post-image-label edit-post-image-new">
                      Nouă
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeNewImage(index)
                      }
                      disabled={saving}
                      aria-label="Elimină imaginea"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="edit-post-section">
            <div className="edit-post-section-heading">
              <div>
                <span>Experiența ta</span>
                <h2>Poveste și recomandări</h2>
              </div>
            </div>

            <div className="edit-post-fields">
              <label className="edit-post-field edit-post-field-full">
                <span>Povestea călătoriei *</span>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={10000}
                  rows={9}
                  placeholder="Povestește cum a fost călătoria..."
                  disabled={saving}
                />

                <small>
                  {formData.description.length}/10000
                </small>
              </label>

              <label className="edit-post-field edit-post-field-full">
                <span>Ponturi utile *</span>

                <textarea
                  name="tips"
                  value={formData.tips}
                  onChange={handleChange}
                  maxLength={3000}
                  rows={6}
                  placeholder="Ce ar trebui să știe ceilalți călători?"
                  disabled={saving}
                />

                <small>
                  {formData.tips.length}/3000
                </small>
              </label>
            </div>
          </section>

          <div className="edit-post-actions">
            <button
              type="button"
              className="edit-post-cancel"
              onClick={() => router.back()}
              disabled={saving}
            >
              Renunță
            </button>

            <button
              type="submit"
              className="edit-post-submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    className="edit-post-spinner"
                    size={19}
                  />
                  Se salvează...
                </>
              ) : (
                <>
                  <Save size={19} />
                  Salvează modificările
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}