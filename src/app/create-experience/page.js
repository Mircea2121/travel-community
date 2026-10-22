"use client";

/* eslint-disable @next/next/no-img-element -- Preview local blob înainte de upload; este necesar elementul nativ. */

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Camera, Compass, Globe2, ImagePlus, MapPin, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";

import "./createExperience.css";
import "./premiumCreateExperience.css";
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

  const [formData, setFormData] = useState(
    INITIAL_FORM_DATA
  );

  const [
    selectedImages,
    setSelectedImages,
  ] = useState([]);

  const [
    imagePreviews,
    setImagePreviews,
  ] = useState([]);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    formMessage,
    setFormMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const previewUrlsRef = useRef([]);
  useEffect(() => {
    previewUrlsRef.current = imagePreviews;
  }, [imagePreviews]);
  useEffect(() => () => {
    previewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    const nextValue =
      name === "totalCost"
        ? value.replace(
            /\D/g,
            ""
          )
        : value;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]:
          nextValue,
      })
    );

    if (formMessage.text) {
      setFormMessage({
        type: "",
        text: "",
      });
    }
  }

  function handleImageChange(
    event
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    setFormMessage({
      type: "",
      text: "",
    });

    if (
      files.length === 0
    ) {
      return;
    }

    if (
      files.length >
      MAX_IMAGES
    ) {
      setFormMessage({
        type: "error",
        text:
          `Poți încărca maximum ${MAX_IMAGES} poze.`,
      });

      event.target.value =
        "";

      return;
    }

    const invalidTypeImage =
      files.find(
        (file) =>
          !ALLOWED_IMAGE_TYPES.includes(
            file.type
          )
      );

    if (
      invalidTypeImage
    ) {
      setFormMessage({
        type: "error",
        text:
          "Sunt acceptate doar imagini JPG, PNG sau WEBP.",
      });

      event.target.value =
        "";

      return;
    }

    const oversizedImage =
      files.find(
        (file) =>
          file.size >
          MAX_IMAGE_SIZE
      );

    if (
      oversizedImage
    ) {
      setFormMessage({
        type: "error",
        text:
          "Fiecare imagine trebuie să aibă maximum 10 MB.",
      });

      event.target.value =
        "";

      return;
    }

    imagePreviews.forEach(
      (preview) => {
        URL.revokeObjectURL(
          preview
        );
      }
    );

    const newPreviews =
      files.map((file) =>
        URL.createObjectURL(
          file
        )
      );

    setSelectedImages(
      files
    );

    setImagePreviews(
      newPreviews
    );
  }

  function removeImage(
    imageIndex
  ) {
    const previewToRemove =
      imagePreviews[
        imageIndex
      ];

    if (
      previewToRemove
    ) {
      URL.revokeObjectURL(
        previewToRemove
      );
    }

    setSelectedImages(
      (previousImages) =>
        previousImages.filter(
          (_, index) =>
            index !==
            imageIndex
        )
    );

    setImagePreviews(
      (previousPreviews) =>
        previousPreviews.filter(
          (_, index) =>
            index !==
            imageIndex
        )
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      isSubmitting
    ) {
      return;
    }

    if (
      selectedImages.length ===
      0
    ) {
      setFormMessage({
        type: "error",
        text:
          "Te rog să adaugi cel puțin o poză.",
      });

      return;
    }

    setIsSubmitting(true);

    setFormMessage({
      type: "",
      text: "",
    });

    try {
      const requestFormData =
        new FormData();

      Object.entries(
        formData
      ).forEach(
        ([
          fieldName,
          fieldValue,
        ]) => {
          requestFormData.append(
            fieldName,
            fieldValue
          );
        }
      );

      selectedImages.forEach(
        (image) => {
          requestFormData.append(
            "images",
            image
          );
        }
      );

      const response =
        await fetch(
          "/api/posts",
          {
            method:
              "POST",

            body:
              requestFormData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "Postarea nu a putut fi publicată."
        );
      }

      imagePreviews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview
          );
        }
      );

      setFormData(
        INITIAL_FORM_DATA
      );

      setSelectedImages(
        []
      );

      setImagePreviews(
        []
      );

      setFormMessage({
        type:
          "success",

        text:
          data.message ||
          "Postarea a fost publicată cu succes.",
      });

      setTimeout(() => {
        router.push(
          "/profile"
        );

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
          <span className="create-experience-badge"><Compass size={15} aria-hidden="true" /> Jurnal de călătorie</span>
          <h1>Povestește-ți călătoria.</h1>
          <p>Locuri care te-au surprins, detalii care contează și recomandări pe care ai vrea să le fi primit înainte să pleci.</p>
        </div>
        <div className="experience-workspace">
        <form className="experience-form" onSubmit={handleSubmit}>
          <section className="experience-section" aria-labelledby="experience-details-heading">
            <header className="experience-section-heading"><span className="experience-section-number" aria-hidden="true">01</span><div><h2 id="experience-details-heading">Locul și detaliile</h2><p>Începe cu destinația și câteva repere ale călătoriei.</p></div><MapPin size={22} aria-hidden="true" /></header>
            <div className="experience-section-fields">
          <div className="form-group">
            <label htmlFor="title">
              Titlul postării
            </label>

            <input
              id="title"
              type="text"
              name="title"
              placeholder="Exemplu: 5 zile superbe în Sardinia"
              value={
                formData.title
              }
              onChange={
                handleChange
              }
              minLength={5}
              maxLength={120}
              disabled={
                isSubmitting
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="destination">
                Destinație
              </label>

              <input
                id="destination"
                type="text"
                name="destination"
                placeholder="Exemplu: Sardinia"
                value={
                  formData.destination
                }
                onChange={
                  handleChange
                }
                maxLength={100}
                disabled={
                  isSubmitting
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">
                Țară
              </label>

              <input
                id="country"
                type="text"
                name="country"
                placeholder="Exemplu: Italia"
                value={
                  formData.country
                }
                onChange={
                  handleChange
                }
                maxLength={80}
                disabled={
                  isSubmitting
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">
                Oraș / Zonă <span className="field-optional">opțional</span>
              </label>

              <input
                id="city"
                type="text"
                name="city"
                placeholder="Exemplu: Cagliari, Olbia, Costa Smeralda"
                value={
                  formData.city
                }
                onChange={
                  handleChange
                }
                maxLength={120}
                disabled={
                  isSubmitting
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Categorie
              </label>

              <select
                id="category"
                name="category"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                required
              >
                <option value="">
                  Alege categoria
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
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="travelPeriod">
                Perioada călătoriei <span className="field-optional">opțional</span>
              </label>

              <input
                id="travelPeriod"
                type="text"
                name="travelPeriod"
                placeholder="Exemplu: 26 septembrie - 2 octombrie"
                value={
                  formData.travelPeriod
                }
                onChange={
                  handleChange
                }
                maxLength={100}
                disabled={
                  isSubmitting
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalCost">
                Cost total aproximativ <span className="field-optional">opțional</span>
              </label>

              <div className="cost-input-wrapper">
                <input
                  id="totalCost"
                  type="text"
                  name="totalCost"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Exemplu: 700"
                  value={
                    formData.totalCost
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={9}
                  disabled={
                    isSubmitting
                  }
                />

                <span className="cost-currency">
                  €
                </span>
              </div>
            </div>
          </div>


            </div>
          </section>
          <section className="experience-section" aria-labelledby="experience-story-heading">
            <header className="experience-section-heading"><span className="experience-section-number" aria-hidden="true">02</span><div><h2 id="experience-story-heading">Experiența ta, în cuvinte</h2><p>Scrie firesc. Cele mai utile detalii vin din experiența proprie.</p></div><PenLine size={22} aria-hidden="true" /></header>
            <div className="experience-section-fields">
          <div className="form-group">
            <label htmlFor="tips">
              Ponturi utile
            </label>

            <textarea
              id="tips"
              name="tips"
              placeholder="Exemplu: unde ai mâncat bine, ce merită vizitat, ce să eviți, parcări, transport, prețuri..."
              value={
                formData.tips
              }
              onChange={
                handleChange
              }
              minLength={10}
              maxLength={3000}
              disabled={
                isSubmitting
              }
              required
            />
            <small className="field-hint">Recomandări concrete, locuri preferate și lucruri de evitat.</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Povestea ta
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Scrie liber cum a fost experiența ta..."
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              minLength={20}
              maxLength={10000}
              disabled={
                isSubmitting
              }
              required
            />
          </div>


            </div>
          </section>
          <section className="experience-section" aria-labelledby="experience-photos-heading">
            <header className="experience-section-heading"><span className="experience-section-number" aria-hidden="true">03</span><div><h2 id="experience-photos-heading">Povestea, în fotografii</h2><p>Prima fotografie aleasă va fi coperta postării.</p></div><Camera size={22} aria-hidden="true" /></header>
            <div className="experience-section-fields">
          <div className="form-group">
            <label htmlFor="experience-images">
              Poze din călătorie
            </label>

            <label
              className={`image-upload-box ${
                isSubmitting
                  ? "image-upload-box-disabled"
                  : ""
              }`}
            >
              <input
                id="experience-images"
                aria-describedby="image-upload-hint"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={
                  handleImageChange
                }
                disabled={
                  isSubmitting
                }
              />

              <span className="upload-visual" aria-hidden="true"><ImagePlus size={27} strokeWidth={1.5} /></span>
              <span>
                Selectează fotografiile
              </span>

              <small id="image-upload-hint">
                Minimum 1 poză, maximum 10 poze,
                maximum 10 MB fiecare
              </small>
            </label>

            {imagePreviews.length >
              0 && (
              <div className="image-preview-grid">
                {imagePreviews.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      className="image-preview-card"
                      key={
                        image
                      }
                    >
                      <img
                        src={
                          image
                        }
                        alt={`Previzualizare poză ${
                          index +
                          1
                        }`}
                      />

                      {index === 0 && <span className="preview-cover-label">Copertă</span>}
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                        disabled={
                          isSubmitting
                        }
                        aria-label={`Șterge poza ${
                          index +
                          1
                        }`}
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>


            </div>
          </section>
          {formMessage.text && (
            <div
              className={`experience-form-message ${
                formMessage.type ===
                "success"
                  ? "experience-form-message-success"
                  : "experience-form-message-error"
              }`}
              role="alert"
            >
              {
                formMessage.text
              }
            </div>
          )}

          <div className="experience-publish-row"><p>O experiență reală poate inspira următoarea călătorie.<small>Câmpurile fără mențiunea „opțional” sunt necesare.</small></p>
          <button
            type="submit"
            className="submit-experience-btn"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Se publică postarea..."
              : "Publică postarea"}
          </button></div>

        </form>
        <aside className="experience-editor-guide" aria-label="Sfaturi pentru publicare">
          <span className="editor-guide-eyebrow">Din călător în călător</span>
          <h2>Detaliile mici fac poveștile utile.</h2>
          <p>Gândește-te la ce ai fi vrut să știi înainte să pleci.</p>
          <ol><li><strong>Fii concret.</strong><span>Un loc, un traseu sau o recomandare pe care ai încercat-o.</span></li><li><strong>Pune costurile în context.</strong><span>Precizează perioada și pentru câte persoane a fost bugetul.</span></li><li><strong>Arată locul prin ochii tăi.</strong><span>Alege fotografii proprii și păstrează datele personale private.</span></li></ol>
          <a href="/ghid-publicare">Ghidul unei postări utile <ArrowUpRight size={16} aria-hidden="true" /></a>
          <div className="editor-guide-footnote"><Globe2 size={17} aria-hidden="true" /><span>Fotografii, ponturi și experiențe reale pentru comunitate.</span></div>
        </aside>
        </div>
      </div>
    </section>
  );
}
