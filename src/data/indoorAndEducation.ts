export type RoomId = 'bedroom' | 'living' | 'children' | 'kitchen';

export interface RoomGuide {
  id: RoomId;
  name: string;
  focus: string;
  recommendations: string[];
  checklist: Array<{
    key: string;
    label: string;
    detail: string;
  }>;
}

export const ROOM_GUIDES: RoomGuide[] = [
  {
    id: 'bedroom',
    name: 'Bedroom',
    focus: 'Clean overnight recovery air for 7–9 hours of sleep',
    recommendations: [
      'Seal window perimeter gaps with weatherstripping tape when outdoor CPCB AQI exceeds 200.',
      'Run an appropriately sized True HEPA (H13) purifier 45 minutes before bedtime and keep it on quiet sleep mode overnight.',
      'Wash pillowcases and bedding weekly in warm water and damp-wipe bedside tables instead of dry dusting.',
      'Keep indoor relative humidity between 40% and 55%—avoid over-humidifying, which encourages dust mites and mold.',
    ],
    checklist: [
      {
        key: 'bed_windows_sealed',
        label: 'External bedroom windows closed during high outdoor AQI',
        detail: 'Check hourly forecast before cracking windows open.',
      },
      {
        key: 'bed_hepa_running',
        label: 'True HEPA purifier placed 30 cm from walls and running',
        detail: 'Replace pre-filter vacuuming monthly and HEPA cartridge per manufacturer schedule.',
      },
      {
        key: 'bed_damp_wipe',
        label: 'Floors and nightstands damp-wiped today',
        detail: 'Prevents settled PM10 dust from resuspending overnight.',
      },
      {
        key: 'bed_no_combustion',
        label: 'Zero scented candles, incense, or mosquito coils in bedroom',
        detail: 'Combustion spikes indoor PM2.5 rapidly in enclosed rooms.',
      },
    ],
  },
  {
    id: 'living',
    name: 'Living Room',
    focus: 'High-traffic shared zone & entryway particle control',
    recommendations: [
      'Create a shoes-off entryway mat system so outdoor road dust and heavy metals stay at the door.',
      'Cross-ventilate only during brief midday dips when outdoor AQI drops below 120; keep doors shut during morning and evening peaks.',
      'Size your HEPA purifier CADR to match living room area (aim for 4–5 air changes per hour).',
      'Never use ozone generators or ionizers that emit ozone—stick strictly to mechanical HEPA + activated carbon filtration.',
    ],
    checklist: [
      {
        key: 'liv_shoes_off',
        label: 'Outdoor shoes and jackets kept near entryway',
        detail: 'Reduces tracked-in road particulates on carpets and sofas.',
      },
      {
        key: 'liv_vent_timed',
        label: 'Ventilation timed strictly to lower-pollution forecast window',
        detail: 'Avoid opening balcony doors between 6–9 AM and 7–11 PM during winter smog.',
      },
      {
        key: 'liv_hepa_cadr',
        label: 'Purifier fan speed stepped up after door openings',
        detail: 'Run medium-high for 20 minutes after guests or deliveries enter.',
      },
      {
        key: 'liv_humidity',
        label: 'Indoor humidity checked (target 40–55%)',
        detail: 'Prevents dry throat irritation while avoiding damp mold growth.',
      },
    ],
  },
  {
    id: 'children',
    name: "Children's Room",
    focus: 'Protecting developing lungs during study & indoor play',
    recommendations: [
      'Keep plush toys minimal and wash soft toys regularly to limit trapped dust and allergens.',
      'After school commute, have children change outdoor uniforms and wash hands and face before playing on rugs.',
      'Use a HEPA purifier rated for the room square footage and verify child-lock safety on controls.',
      'Encourage calm indoor games on Severe AQI days instead of dusty attic or balcony play.',
    ],
    checklist: [
      {
        key: 'kid_change_clothes',
        label: 'School uniforms changed & faces washed after returning home',
        detail: 'Removes surface soot and pollen brought in from traffic.',
      },
      {
        key: 'kid_damp_floor',
        label: 'Play mat and floor mopped with damp microfiber cloth',
        detail: 'Children breathe closer to floor level where coarse dust settles.',
      },
      {
        key: 'kid_filter_check',
        label: 'Purifier intake grille clear of toys, curtains, or books',
        detail: 'Unobstructed airflow maintains rated CADR performance.',
      },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    focus: 'Controlling cooking PM2.5, NO2, and moisture spikes',
    recommendations: [
      'Switch on the ducted chimney or exhaust fan 2 minutes before lighting the gas stove and keep it on 10 minutes after cooking.',
      'Use lids on pots when boiling or tempering spices (tadka) to cut ultrafine aerosol and oil mist emissions.',
      'Keep a small crack or door ventilation toward an internal corridor if outdoor air is Severe, or open kitchen window briefly when outdoor AQI is lower.',
      'Wipe exhaust mesh filters every 2 weeks so grease buildup does not block suction.',
    ],
    checklist: [
      {
        key: 'kit_exhaust_on',
        label: 'Chimney / exhaust fan used throughout all cooking',
        detail: 'Gas combustion and high-heat frying can spike kitchen PM2.5 above 300 µg/m³.',
      },
      {
        key: 'kit_lids_used',
        label: 'Lids used during high-heat simmering and tadka',
        detail: 'Significantly lowers indoor oil aerosol concentration.',
      },
      {
        key: 'kit_moisture',
        label: 'Steam vented without creating damp wall condensation',
        detail: 'Controls mold risk around sinks and cabinetry.',
      },
    ],
  },
];

export const DAILY_INDOOR_HABITS = [
  'Avoid all indoor smoking, agarbatti (incense), dhoop, and scented candles when AQI is Moderate or worse.',
  'Replace dry brooming with damp mopping or a HEPA-filtered vacuum cleaner.',
  'Inspect air purifier filter indicators monthly and replace saturated HEPA/carbon cartridges on schedule.',
  'Never purchase or run ozone-generating purifiers—ozone irritates airways even at low indoor levels.',
];
