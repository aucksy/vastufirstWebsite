/**
 * The nine zones, taken from the app's own rule dataset
 * (VastuFirst/rules/src/main/resources/ruleset/zones.json + rooms.json).
 *
 * This file is the reason the site and the app cannot say different things.
 * If a deity, an element or a room rule changes in the ruleset, change it here
 * in the same week — and check the counts quoted in WhyVastuFirst.astro, which
 * are read from the same folder.
 *
 * Two deliberate departures from the design prototype, both corrections:
 *  1. The prototype invented an element for every zone ("Air · Vayu" for East,
 *     "Space · Varuna" for West). The ruleset assigns an element to only four
 *     zones plus the centre; the rest carry a deity and a domain. We show what
 *     is actually there.
 *  2. The prototype labelled each zone with a 45° bearing range. The engine
 *     does not use angular sectors for zones at all — it uses the 81-pada
 *     square grid, nine padas to a zone (PRD 0.5). The chip says so.
 */

export interface Zone {
  /** Abbreviation on the wheel. `C` is the centre, which is not a wedge. */
  ab: string;
  name: string;
  deva: string;
  sanskrit: string;
  /** Sage chip: the classical attribution — element where the ruleset has one. */
  attribution: string;
  /** Gold chip: what the engine actually measures. */
  measure: string;
  desc: string;
}

export const zones: Zone[] = [
  {
    ab: 'N',
    name: 'North',
    deva: 'उत्तर',
    sanskrit: 'Uttara',
    attribution: 'Kubera',
    measure: '9 of 81 padas',
    desc: 'Kubera’s quarter, read for wealth and work. Nothing is barred from the north — a living room or a balcony scores as ideal here.',
  },
  {
    ab: 'NE',
    name: 'North-East',
    deva: 'ईशान्य',
    sanskrit: 'Ishanya',
    attribution: 'Water · Ishana',
    measure: '9 of 81 padas',
    desc: 'The head of the Purusha, and the corner tradition guards most closely. A pooja room is ideal here; a toilet, a kitchen or a staircase is a major defect.',
  },
  {
    ab: 'E',
    name: 'East',
    deva: 'पूर्व',
    sanskrit: 'Purva',
    attribution: 'Indra',
    measure: '9 of 81 padas',
    desc: 'Indra’s quarter, read for vitality and standing. Whether a toilet may sit here is one of the ten questions the app refuses to settle for you.',
  },
  {
    ab: 'SE',
    name: 'South-East',
    deva: 'आग्नेय',
    sanskrit: 'Agneya',
    attribution: 'Fire · Agni',
    measure: '9 of 81 padas',
    desc: 'Agni’s corner — fire’s own quarter. The kitchen is ideal here, and so is the garage. A bedroom is not, and stored water is read against the fire.',
  },
  {
    ab: 'S',
    name: 'South',
    deva: 'दक्षिण',
    sanskrit: 'Dakshina',
    attribution: 'Yama',
    measure: '9 of 81 padas',
    desc: 'Yama’s quarter, read for rest, discipline and reputation. Tradition wants weight along the south: a staircase or a store is ideal, a study is not.',
  },
  {
    ab: 'SW',
    name: 'South-West',
    deva: 'नैऋत्य',
    sanskrit: 'Nairritya',
    attribution: 'Earth · Nirriti',
    measure: '9 of 81 padas',
    desc: 'The feet of the Purusha, and the heaviest ground on the grid. The master bedroom belongs here — a kitchen, a toilet or an open balcony is a defect.',
  },
  {
    ab: 'W',
    name: 'West',
    deva: 'पश्चिम',
    sanskrit: 'Paschima',
    attribution: 'Varuna',
    measure: '9 of 81 padas',
    desc: 'Varuna’s quarter, read for gains, savings and learning. A settled zone that takes a great deal — dining, study, bedrooms, even the toilet.',
  },
  {
    ab: 'NW',
    name: 'North-West',
    deva: 'वायव्य',
    sanskrit: 'Vayavya',
    attribution: 'Air · Vayu',
    measure: '9 of 81 padas',
    desc: 'Vayu’s quarter — the zone of movement: guests, vehicles, things meant to leave. Guest rooms, the garage and the toilet are at home here.',
  },
  {
    ab: 'C',
    name: 'Brahmasthan',
    deva: 'ब्रह्मस्थान',
    sanskrit: 'Brahmasthan',
    attribution: 'Space · Brahma',
    measure: 'the centre 9 padas',
    desc: 'The nine squares at the dead centre, held by Brahma. The texts say they must stay open — heavy weight here is the one defect taken straight from the classical source.',
  },
];

/** The eight wedges. The centre is drawn as a circle, not a wedge. */
export const wedgeZones = zones.slice(0, 8);

/**
 * Wedge geometry, transcribed from the design file's renderVals().
 * Inner radius 38, outer 112, 45° each, North centred at 12 o'clock.
 */
export const wedges = wedgeZones.map((z, i) => {
  const a0 = ((i * 45 - 112.5) * Math.PI) / 180;
  const a1 = ((i * 45 - 67.5) * Math.PI) / 180;
  const am = ((i * 45 - 90) * Math.PI) / 180;
  const R = 112;
  const r = 38;
  const f = (n: number) => n.toFixed(1);
  const path =
    `M${f(Math.cos(a0) * r)} ${f(Math.sin(a0) * r)}` +
    ` L${f(Math.cos(a0) * R)} ${f(Math.sin(a0) * R)}` +
    ` A${R} ${R} 0 0 1 ${f(Math.cos(a1) * R)} ${f(Math.sin(a1) * R)}` +
    ` L${f(Math.cos(a1) * r)} ${f(Math.sin(a1) * r)}` +
    ` A${r} ${r} 0 0 0 ${f(Math.cos(a0) * r)} ${f(Math.sin(a0) * r)} Z`;
  const lx = +(Math.cos(am) * 78).toFixed(1);
  const ly = +(Math.sin(am) * 78 + 3).toFixed(1);
  return { path, lx, ly, rot: `rotate(${i * 45} ${lx} ${ly - 3})`, ab: z.ab, wid: `vfW${i}` };
});
