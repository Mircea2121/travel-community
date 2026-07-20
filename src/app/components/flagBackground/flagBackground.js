import "./flagBackground.css";

const flags = [
  { code: "ro", name: "România" },
  { code: "it", name: "Italia" },
  { code: "es", name: "Spania" },
  { code: "gr", name: "Grecia" },
  { code: "pt", name: "Portugalia" },
  { code: "fr", name: "Franța" },
  { code: "au", name: "Australia" },
  { code: "th", name: "Thailanda" },
  { code: "jp", name: "Japonia" },
  { code: "br", name: "Brazilia" },
  { code: "mx", name: "Mexic" },
  { code: "za", name: "Africa de Sud" },
  { code: "in", name: "India" },
  { code: "id", name: "Indonezia" },
  { code: "ma", name: "Maroc" },
  { code: "sg", name: "Singapore" },
  { code: "nz", name: "Noua Zeelandă" },
  { code: "ca", name: "Canada" },
  { code: "ar", name: "Argentina" },
  { code: "hr", name: "Croația" },
  { code: "is", name: "Islanda" },
  { code: "tr", name: "Turcia" },
  { code: "eg", name: "Egipt" },
  { code: "mv", name: "Maldive" },

  { code: "us", name: "Statele Unite" },
  { code: "gb", name: "Regatul Unit" },
  { code: "de", name: "Germania" },
  { code: "at", name: "Austria" },
  { code: "ch", name: "Elveția" },
  { code: "be", name: "Belgia" },
  { code: "nl", name: "Țările de Jos" },
  { code: "dk", name: "Danemarca" },
  { code: "no", name: "Norvegia" },
  { code: "se", name: "Suedia" },
  { code: "fi", name: "Finlanda" },
  { code: "ie", name: "Irlanda" },
  { code: "cz", name: "Cehia" },
  { code: "pl", name: "Polonia" },
  { code: "hu", name: "Ungaria" },
  { code: "bg", name: "Bulgaria" },
  { code: "rs", name: "Serbia" },
  { code: "si", name: "Slovenia" },
  { code: "cy", name: "Cipru" },
  { code: "ae", name: "Emiratele Arabe Unite" },
  { code: "kr", name: "Coreea de Sud" },
  { code: "vn", name: "Vietnam" },
  { code: "ph", name: "Filipine" },
  { code: "cl", name: "Chile" },
];

export default function FlagBackground() {
  return (
    <div className="flag-background" aria-hidden="true">
      {flags.map((flag, index) => (
        <div
          key={flag.code}
          className={`flag-background-item flag-background-item-${index + 1}`}
          title={flag.name}
        >
          <img
            src={`https://flagcdn.com/w320/${flag.code}.png`}
            alt=""
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}