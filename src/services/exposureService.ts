import type {
  AirQualitySnapshot,
  FamilyMemberProfile,
  HouseholdExposureSummary,
  MemberExposureAssessment,
} from '../types/breathewise.ts';

function getMemberPrecautions(
  member: FamilyMemberProfile,
  aqi: number
): { precautions: string[]; indoorAlternatives: string[] } {
  const precautions: string[] = [];
  const indoorAlternatives: string[] = [];
  const isPoorOrWorse = aqi >= 201;
  const isModerate = aqi >= 101 && aqi < 201;

  if (member.ageGroup === 'Child (0-12)') {
    if (isPoorOrWorse) {
      precautions.push(
        'Skip outdoor playground time and morning assembly/PT drills during peak smog.',
        'Ensure an appropriately sized child-fit N95/KF94 mask for school commute if outdoors >10 minutes.',
        'Keep bedroom windows sealed and run a HEPA purifier before bedtime.'
      );
      indoorAlternatives.push(
        'Indoor creative play, building blocks, stretching games, or story reading.'
      );
    } else if (isModerate) {
      precautions.push(
        'Limit outdoor play to mid-afternoon lower-AQI windows away from busy road traffic.',
        'Watch for coughing or fatigue after school commute.'
      );
      indoorAlternatives.push('Alternating indoor puzzles and short balcony-free active play.');
    } else {
      precautions.push('Normal outdoor play is suitable; rinse hands and face after returning indoors.');
      indoorAlternatives.push('Outdoor park play is favored today.');
    }
  } else if (member.ageGroup === 'Elderly (60+)') {
    if (isPoorOrWorse) {
      precautions.push(
        'Postpone early-morning walks when winter thermal inversion traps ground-level PM2.5.',
        'Stay indoors with filtered air and keep routine prescribed inhalers or medications easily reachable.'
      );
      indoorAlternatives.push('Gentle indoor corridor walking, chair yoga, or breathing exercises.');
    } else if (isModerate) {
      precautions.push(
        'Shift walks to late morning or mid-afternoon and avoid steep exertion outdoors.'
      );
      indoorAlternatives.push('Light indoor stretching and physiotherapy.');
    } else {
      precautions.push('Morning or evening gentle walks are comfortable; stay hydrated.');
      indoorAlternatives.push('Garden or neighbourhood park stroll.');
    }
  } else if (member.activityType === 'Outdoor Worker') {
    precautions.push(
      isPoorOrWorse
        ? 'Use a well-sealed N95 respirator during outdoor shifts and take periodic indoor rest breaks.'
        : 'Prefer shaded or lower-traffic routes when moving between work sites.',
      'Wash face and nasal passages with clean water after prolonged street exposure.'
    );
    indoorAlternatives.push('Rotate indoor administrative or shaded tasks during peak smog hours.');
  } else if (member.activityType === 'Morning Jogger') {
    precautions.push(
      isPoorOrWorse
        ? 'Replace outdoor running today—high ventilation rates during cardio draw PM2.5 deeper into lungs.'
        : isModerate
        ? 'Move runs away from main roads to mid-afternoon windows or reduce pace.'
        : 'Outdoor running conditions are favorable today.'
    );
    indoorAlternatives.push('Indoor stationary cycling, skipping, or bodyweight strength circuit.');
  } else {
    precautions.push(
      isPoorOrWorse
        ? 'Use car cabin air recirculation or wear an N95 mask on two-wheelers and open transit.'
        : 'Monitor local AQI before extended evening walks.'
    );
    indoorAlternatives.push('Indoor mobility session or evening family cooking with exhaust fan on.');
  }

  if (member.sensitivity !== 'None') {
    precautions.unshift(
      `Sensitivity priority (${member.sensitivity}): ${
        aqi >= 150
          ? 'Elevated irritation risk today. Follow your clinician’s existing care plan and seek medical care promptly if breathing symptoms worsen.'
          : 'Keep your regular clinician-prescribed care plan accessible as a precaution.'
      }`
    );
  }

  return { precautions, indoorAlternatives };
}

export function computeHouseholdExposure(
  airQuality: AirQualitySnapshot,
  familyMembers: FamilyMemberProfile[]
): HouseholdExposureSummary {
  const aqi = airQuality.cpcbAqi;
  // Base AQI exposure factor (0-65)
  const baseAqiFactor = Math.min(65, Math.round((aqi / 450) * 65));

  const memberAssessments: MemberExposureAssessment[] = familyMembers.map((member) => {
    let ageWeight = 5;
    if (member.ageGroup === 'Child (0-12)') ageWeight = 14;
    else if (member.ageGroup === 'Elderly (60+)') ageWeight = 15;
    else if (member.ageGroup === 'Teen (13-17)') ageWeight = 8;

    let sensitivityWeight = 0;
    if (member.sensitivity === 'Asthma / Respiratory') sensitivityWeight = 14;
    else if (member.sensitivity === 'Cardiac Sensitivity') sensitivityWeight = 12;
    else if (member.sensitivity === 'Pregnancy') sensitivityWeight = 11;
    else if (member.sensitivity === 'Allergic Rhinitis') sensitivityWeight = 8;

    let exposureWeight = 3;
    if (member.outdoorExposure === 'High (>3 hrs/day)') exposureWeight = 12;
    else if (member.outdoorExposure === 'Moderate (1-3 hrs/day)') exposureWeight = 7;

    if (member.activityType === 'Outdoor Worker' || member.activityType === 'Morning Jogger') {
      exposureWeight += 4;
    }

    const rawScore = Math.min(100, Math.max(5, baseAqiFactor + ageWeight + sensitivityWeight + exposureWeight));
    const exposureBand: MemberExposureAssessment['exposureBand'] =
      rawScore >= 75
        ? 'High'
        : rawScore >= 50
        ? 'Elevated'
        : rawScore >= 28
        ? 'Moderate'
        : 'Low';

    const { precautions, indoorAlternatives } = getMemberPrecautions(member, aqi);

    return {
      memberId: member.id,
      name: member.name,
      ageGroup: member.ageGroup,
      sensitivity: member.sensitivity,
      exposureScore: rawScore,
      exposureBand,
      precautions,
      indoorAlternatives,
    };
  });

  const overallScore = memberAssessments.length
    ? Math.round(
        memberAssessments.reduce((sum, m) => sum + m.exposureScore, 0) /
          memberAssessments.length
      )
    : Math.min(100, Math.max(8, baseAqiFactor + 10));

  const band: HouseholdExposureSummary['band'] =
    overallScore >= 75
      ? 'High'
      : overallScore >= 50
      ? 'Elevated'
      : overallScore >= 28
      ? 'Moderate'
      : 'Low';

  const hasChildren = familyMembers.some((m) => m.ageGroup === 'Child (0-12)');
  const hasElderly = familyMembers.some((m) => m.ageGroup === 'Elderly (60+)');
  const hasSensitive = familyMembers.some((m) => m.sensitivity !== 'None');

  const topThreeActions: string[] = [];
  if (aqi >= 201) {
    topThreeActions.push(
      `Keep external windows and balcony doors sealed in ${airQuality.city} while CPCB AQI is ${aqi} (${airQuality.category}).`
    );
    topThreeActions.push(
      hasChildren
        ? 'Move children’s active play indoors and pack a well-fitted N95 mask for school commutes.'
        : hasElderly
        ? 'Postpone morning walks for elderly family members and encourage gentle indoor movement.'
        : 'Avoid vigorous outdoor exercise today and switch to indoor workouts.'
    );
    topThreeActions.push(
      hasSensitive
        ? 'Run a properly sized HEPA purifier in bedrooms and keep clinician-prescribed respiratory care plans handy.'
        : 'Run HEPA air purification on medium-high in occupied rooms and avoid incense, candles, or indoor smoke.'
    );
  } else if (aqi >= 101) {
    topThreeActions.push(
      `Check the Outdoor Planner before heading out in ${airQuality.city}—choose the lowest-AQI window (${airQuality.outdoorWindows[0]?.windowLabel ?? 'mid-afternoon'}).`
    );
    topThreeActions.push(
      hasChildren || hasSensitive
        ? 'Keep outdoor exertion moderate for children and sensitive family members, away from busy traffic junctions.'
        : 'Use damp mopping indoors to keep settled PM10 dust low without stirring particles.'
    );
    topThreeActions.push(
      'Use kitchen exhaust ventilation while cooking and ventilate briefly only when outdoor AQI dips.'
    );
  } else {
    topThreeActions.push(
      `Air quality in ${airQuality.city} is ${airQuality.category} (${aqi} CPCB AQI)—a good window to cross-ventilate rooms briefly.`
    );
    topThreeActions.push(
      'Enjoy outdoor walks or family park time away from congested intersections.'
    );
    topThreeActions.push(
      'Check evening AQI updates before sunset, as winter temperatures can trap evening traffic emissions.'
    );
  }

  return {
    overallScore,
    band,
    disclaimer:
      'Informational exposure estimate based on local CPCB AQI, age group, and outdoor habits—not a medical diagnosis.',
    topThreeActions,
    memberAssessments,
  };
}
