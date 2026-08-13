// Knowledge base for the RAG assistant. In a real project these would be uploaded files
// (PDF/site/Notion) ingested into a vector store; here they're inlined for a zero-infra demo.

export const DOCUMENTS = [
  {
    source: "tours.md",
    text: `Summit Trails tour catalog. Sunrise Summit (Half-Day): 5 hours, departs 5:00 AM, Moderate difficulty, max 8 people, CAD $129 per person, includes certified guide, headlamps, trekking poles, hot breakfast at the summit and photos, best for first-timers and photographers, kids 12+.
Glacier Ridge Full-Day: 9 hours, Challenging, max 6, CAD $249 per person, includes guide, crampons, helmet, packed lunch and safety briefing, for experienced hikers 16+ with good fitness.
Family Meadow Walk: 3 hours, Easy, max 12, CAD $69 per person, kids under 6 free, includes guide, snacks and a wildlife guidebook, best for families with young children.
Private Custom Expedition: flexible duration from half to multi-day, private group 1 to 10, from CAD $600 per day for the whole group, includes a dedicated guide, custom route planning and all gear, best for corporate groups and special occasions.
Booking and logistics: book online or by WhatsApp, a 30% deposit confirms your spot, meeting point is Summit Trails base at 210 Bear Street, Banff, we provide boots on request sizes 5 to 13 at no extra charge, tours run rain or shine and are only cancelled by us for lightning or extreme conditions.`
  },
  {
    source: "refund-policy.md",
    text: `Summit Trails refund and cancellation policy. Customer cancellations: 7 or more days before the tour is a full refund minus a CAD $15 processing fee; 3 to 6 days before is a 50% refund; under 48 hours is no refund but you may reschedule once within 12 months at no charge; no-shows get no refund and no reschedule.
Weather cancellations by Summit Trails: if we cancel for safety such as lightning, wildfire smoke or extreme conditions you get a full refund or a free reschedule, your choice; light rain or snow is not a cancellation and tours run rain or shine.
Rescheduling: free reschedule if requested 3 or more days ahead, under 3 days incurs a CAD $25 fee, reschedules are subject to availability and must be used within 12 months.
Deposits: the 30% booking deposit is refundable under the same timeline. To request, email hello@summittrails.example or message on WhatsApp with your booking name and date; refunds are processed to the original payment method within 5 to 7 business days.`
  },
  {
    source: "faq.md",
    text: `Summit Trails FAQ. Experience needed: not for Sunrise Summit, Family Meadow Walk, or a private easy route; Glacier Ridge is challenging, 16+ only, good fitness required. What to bring: water, weather-appropriate layers, sunscreen; we provide poles, headlamps, safety gear and boots on request sizes 5 to 13 free. Group size: small by design, 6 to 12 depending on the tour, private expeditions are just your group. Kids: allowed on Family Meadow Walk with under 6 free and Sunrise Summit 12+, Glacier Ridge is 16+. Bad weather: tours run rain or shine, if we cancel for safety you get a full refund or free reschedule. Payment: a 30% deposit confirms your booking, pay online or via WhatsApp, balance due on the day. Meeting point: Summit Trails base, 210 Bear Street, Banff, sunrise tours depart 5:00 AM. Corporate and private groups: yes, the Private Custom Expedition covers corporate offsites and custom routes from CAD $600 per day for the whole group.`
  }
];

// Split each document into overlapping-ish chunks by sentence groups (~2 sentences each).
export function chunkDocuments(docs = DOCUMENTS) {
  const chunks = [];
  for (const doc of docs) {
    const sentences = doc.text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < sentences.length; i += 2) {
      const text = sentences.slice(i, i + 2).join(" ");
      if (text) chunks.push({ id: `${doc.source}#${i}`, source: doc.source, text });
    }
  }
  return chunks;
}
