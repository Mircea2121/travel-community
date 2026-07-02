import "./stats.css";

export default function Stats() {
  const stats = [
    {
      number: "12K+",
      text: "Membri activi",
    },
    {
      number: "320+",
      text: "Destinații",
    },
    {
      number: "8.5K",
      text: "Review-uri",
    },
    {
      number: "95%",
      text: "Recomandări pozitive",
    },
  ];

  return (
    <section className="stats-section">
      {stats.map((item) => (
        <div className="stat-card" key={item.text}>
          <h2>{item.number}</h2>
          <p>{item.text}</p>
        </div>
      ))}
    </section>
  );
}