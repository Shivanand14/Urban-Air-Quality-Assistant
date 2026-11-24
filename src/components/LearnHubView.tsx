import React, { useState } from 'react';
import { BookOpen, Layers, ShieldCheck, Wind } from 'lucide-react';
import { CPCB_SCALE_BANDS } from '../utils/aqiTheme.ts';

export function LearnHubView() {
  const [particleImgErr, setParticleImgErr] = useState(false);
  const [smogImgErr, setSmogImgErr] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Air Quality Education Hub
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Clear, practical science for families—how Indian CPCB AQI works, why winter smog traps particles, and how HEPA filtration protects your home.
        </p>
      </div>

      {/* Visual Explain Cards: PM2.5 vs PM10 & Winter Thermal Inversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="h-56 bg-slate-100 overflow-hidden">
            {!particleImgErr ? (
              <img
                src="/src/assets/images/edu_particulate_scale_1795508026376.jpg"
                alt="Scientific scale comparison of human hair strand, coarse PM10 dust spheres, and microscopic PM2.5 particles"
                referrerPolicy="no-referrer"
                onError={() => setParticleImgErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                <Layers className="w-8 h-8 text-teal-700 mb-2" />
                <p className="text-sm font-semibold text-slate-800">PM10 vs PM2.5 Scale</p>
                <p className="text-xs text-slate-500 mt-1">
                  Human hair (~70 µm) is nearly 30× wider than a single PM2.5 particle
                </p>
              </div>
            )}
          </div>
          <div className="p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              What are PM2.5 and PM10?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>PM10</strong> are coarse inhalable particles (≤10 micrometers) such as road dust and construction debris that mostly settle in the nose and upper airways.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>PM2.5</strong> are fine combustion particles (≤2.5 micrometers)—about 30 times thinner than a human hair—from vehicle exhaust, crop burning, and cooking smoke. Because they are microscopic, PM2.5 bypasses nasal hairs and reaches deep into lung alveoli.
            </p>
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="h-56 bg-slate-100 overflow-hidden">
            {!smogImgErr ? (
              <img
                src="/src/assets/images/edu_winter_inversion_1795508028071.jpg"
                alt="Indian metropolitan skyline at winter sunrise showing thermal inversion smog layer trapped near ground level"
                referrerPolicy="no-referrer"
                onError={() => setSmogImgErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                <Wind className="w-8 h-8 text-teal-700 mb-2" />
                <p className="text-sm font-semibold text-slate-800">Winter Thermal Inversion</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cold surface air gets pinned beneath warmer upper air
                </p>
              </div>
            )}
          </div>
          <div className="p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Why Is Winter Smog So Persistent?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In summer, warm ground air rises and carries pollution upward. On cold winter mornings and nights, a layer of warm air sits above cooler surface air—a <strong>thermal inversion</strong>—acting like a lid over urban valleys.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Combined with calm wind speeds and higher morning humidity, vehicle exhaust and biomass smoke stay concentrated at breathing height until midday sun warms the surface.
            </p>
          </div>
        </article>
      </div>

      {/* Indian CPCB AQI Reference Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-teal-700" />
          <h2 className="font-display text-lg font-semibold text-slate-900">
            What Is Indian CPCB AQI (and How It Differs from US AQI)?
          </h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          India’s Central Pollution Control Board (CPCB) translates 8 pollutants into a single 0–500 index across 6 bands. Note that Indian CPCB breakpoints differ from US EPA AQI—for instance, 60 µg/m³ PM2.5 is 100 (Satisfactory) on the Indian scale, whereas US EPA scores it higher. BreatheWise AI always labels which standard you are reading.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Category</th>
                <th className="py-2.5 pr-4 font-semibold">CPCB Range</th>
                <th className="py-2.5 font-semibold">Practical Family Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CPCB_SCALE_BANDS.map((band) => (
                <tr key={band.category}>
                  <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{ backgroundColor: band.colorHex }}
                      />
                      {band.category}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono-num text-slate-700 whitespace-nowrap">
                    {band.range}
                  </td>
                  <td className="py-3 text-slate-600">{band.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Indoor vs Outdoor & HEPA Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
          <h3 className="font-display text-base font-semibold text-slate-900">
            Outdoor vs Indoor Air Pollution
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Outdoor smog infiltrates homes through window gaps and doors. Inside, gas stove cooking, frying, agarbatti (incense), candles, and dry sweeping add concentrated indoor PM2.5 and NO2 that can stay trapped if unvented.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              How True HEPA Filters Work
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            True HEPA filters physically trap 99.97% of 0.3-micron particles using a dense fiberglass web—without producing ozone. Always size a purifier’s CADR to your bedroom area, close doors while running it, and avoid ozone-emitting devices.
          </p>
        </section>
      </div>
    </div>
  );
}
