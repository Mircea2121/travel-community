export default function Hero() {
  return (
    <main className="hero">
      <section className="hero__content">
        <div className="hero__text">
          <p className="hero__label">
            Comunitate pentru românii care călătoresc
          </p>

          <h1 className="hero__title">
            Descoperă destinații prin experiențe reale.
          </h1>

          <p className="hero__description">
            Postează poze, lasă recenzii, cere păreri și ajută alți români să
            aleagă următoarea destinație.
          </p>

          <div className="hero__buttons">
            <a href="#register" className="hero__button hero__button--primary">
              Intră în comunitate
            </a>

            <a href="#destinatii" className="hero__button hero__button--secondary">
              Vezi destinații
            </a>
          </div>
        </div>

        <article className="hero__card">
          <div className="hero__image"></div>

          <div className="hero__cardContent">
            <span>Italia</span>
            <h2>Sardinia</h2>
            <p>
              Apă limpede, plaje superbe și vreme foarte bună pentru o vacanță
              la final de septembrie.
            </p>

            <div className="hero__cardFooter">
              <p>Postat de Andrei</p>
              <strong>4.8 ★</strong>
            </div>
          </div>
        </article>
      </section>

      <section id="destinatii" className="homeSection">
        <h2>Destinații populare</h2>
        <p>Aici vom afișa destinațiile adăugate de comunitate.</p>
      </section>

      <section id="recenzii" className="homeSection">
        <h2>Recenzii recente</h2>
        <p>Aici vor apărea recenziile utilizatorilor.</p>
      </section>

      <section id="login" className="homeSection">
        <h2>Autentificare</h2>
        <p>Mai târziu conectăm această secțiune cu Supabase Auth.</p>
      </section>

      <section id="register" className="homeSection">
        <h2>Creează cont</h2>
        <p>Mai târziu facem formularul real de înregistrare.</p>
      </section>
    </main>
  );
}