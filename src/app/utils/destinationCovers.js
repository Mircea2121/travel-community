const DEFAULT_DESTINATION_COVER =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=82";

const DESTINATION_COVERS = {
  grecia:
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=82",
  italia:
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=82",
  spania:
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=82",
  thailanda:
    "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=82",
  romania:
    "https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=1200&q=82",
  japonia:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=82",
  franta:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=82",
  portugalia:
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=82",
  germania:
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=82",
  croatia:
    "https://images.unsplash.com/photo-1555990538-1e6c05a90f8c?auto=format&fit=crop&w=1200&q=82",
  turcia:
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=82",
  austria:
    "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1200&q=82",
  elvetia:
    "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=1200&q=82",
  norvegia:
    "https://images.unsplash.com/photo-1520769669658-f07657f5a307?auto=format&fit=crop&w=1200&q=82",
  islanda:
    "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=1200&q=82",
  egipt:
    "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1200&q=82",
  maroc:
    "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=82",
  indonezia:
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=82",
  mexic:
    "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=82",
  sua:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82",
};

const COUNTRY_ALIASES = {
  greece: "grecia",
  italy: "italia",
  spain: "spania",
  thailand: "thailanda",
  romania: "romania",
  japan: "japonia",
  france: "franta",
  portugal: "portugalia",
  germany: "germania",
  croatia: "croatia",
  turkey: "turcia",
  austria: "austria",
  switzerland: "elvetia",
  norway: "norvegia",
  iceland: "islanda",
  egypt: "egipt",
  morocco: "maroc",
  indonesia: "indonezia",
  mexico: "mexic",
  "statele-unite": "sua",
  "united-states": "sua",
  usa: "sua",
};

export function getDestinationCover(countryKey) {
  const normalizedKey = String(countryKey || "").trim().toLowerCase();
  const resolvedKey = COUNTRY_ALIASES[normalizedKey] || normalizedKey;

  return DESTINATION_COVERS[resolvedKey] || DEFAULT_DESTINATION_COVER;
}
