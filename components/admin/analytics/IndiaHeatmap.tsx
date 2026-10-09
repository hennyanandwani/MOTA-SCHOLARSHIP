'use client';

import { useMemo, useState } from 'react';
import indiaMap from '@svg-maps/india';

type StateMetric = {
  state: string;
  applications: number;
  verified: number;
  pending: number;
  deficiencies: number;
  selected: number;
};

type IndiaMapLocation = {
  id: string;
  name: string;
  path: string;
};

type IndiaMapDefinition = {
  label: string;
  viewBox: string;
  locations: IndiaMapLocation[];
};

type IndiaHeatmapProps = {
  rows: StateMetric[];
  selectedState: string;
  onSelect: (state: string) => void;
  onClear: () => void;
};

const mapData = indiaMap as IndiaMapDefinition;
const allStatesFilter = 'All states / UTs';

function normalizeStateName(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalized === 'orissa') return 'odisha';
  if (normalized === 'uttaranchal') return 'uttarakhand';
  if (normalized === 'nct of delhi' || normalized === 'national capital territory of delhi') return 'delhi';
  if (normalized === 'daman and diu' || normalized === 'dadra and nagar haveli') {
    return 'dadra and nagar haveli and daman and diu';
  }
  return normalized;
}

function fillForApplications(count: number, maximum: number): string {
  if (maximum === 0 || count === 0) return '#F1F5F9';
  const ratio = count / maximum;
  const start = [219, 234, 254];
  const end = [23, 63, 122];
  const color = start.map((value, index) => Math.round(value + (end[index] - value) * ratio));
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export function IndiaHeatmap({ rows, selectedState, onSelect, onClear }: IndiaHeatmapProps) {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const metricsByState = useMemo(() => {
    const metrics = new Map<string, StateMetric>();
    rows.forEach((row) => metrics.set(normalizeStateName(row.state), row));
    return metrics;
  }, [rows]);

  const locations = useMemo(() => mapData.locations.map((location) => {
    const canonicalName = normalizeStateName(location.name);
    const filterState = canonicalName === 'dadra and nagar haveli and daman and diu'
      ? 'Dadra and Nagar Haveli and Daman and Diu'
      : location.name;
    const metric = metricsByState.get(canonicalName) ?? {
      state: filterState,
      applications: 0,
      verified: 0,
      pending: 0,
      deficiencies: 0,
      selected: 0,
    };
    return { ...location, filterState, metric };
  }), [metricsByState]);
  const maximum = Math.max(0, ...locations.map(({ metric }) => metric.applications));
  const currentLocation = locations.find(({ id }) => id === hoveredLocationId)
    ?? locations.find(({ filterState }) => filterState === selectedState)
    ?? null;

  return (
    <section aria-labelledby="india-heatmap-heading" className="mt-5 border-t border-[#DCE3EC] pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="india-heatmap-heading" className="text-sm font-bold text-[#172033]">India application density</h3>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">
            Application counts are illustrative records, not a measure or estimate of tribal population coverage.
          </p>
        </div>
        {selectedState !== allStatesFilter && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-9 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
          >
            Clear state filter
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
        <div className="min-w-0 border border-[#E8EDF3] bg-[#FBFCFE] p-2 sm:p-4">
          <svg
            viewBox={mapData.viewBox}
            role="group"
            aria-label="Interactive map of India states and union territories; select a region to filter application analytics"
            className="mx-auto block max-h-[560px] w-full"
          >
            {locations.map(({ id, name, path, filterState, metric }) => {
              const isSelected = selectedState === filterState;
              return (
                <path
                  key={id}
                  d={path}
                  fill={fillForApplications(metric.applications, maximum)}
                  stroke={isSelected ? '#B7791F' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2.4 : 1.1}
                  vectorEffect="non-scaling-stroke"
                  role="button"
                  tabIndex={0}
                  aria-label={`${name}: ${metric.applications} applications, ${metric.verified} verified, ${metric.pending} pending verification, ${metric.deficiencies} deficiencies, ${metric.selected} selected. Activate to filter.`}
                  aria-pressed={isSelected}
                  className="cursor-pointer outline-none transition-colors hover:stroke-[#173F7A] focus-visible:stroke-[#173F7A]"
                  onMouseEnter={() => setHoveredLocationId(id)}
                  onMouseLeave={() => setHoveredLocationId(null)}
                  onFocus={() => setHoveredLocationId(id)}
                  onBlur={() => setHoveredLocationId(null)}
                  onClick={() => onSelect(filterState)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(filterState);
                    }
                  }}
                >
                  <title>{`${name}: ${metric.applications} demo applications`}</title>
                </path>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#64748B]">
            <span>0 applications</span>
            <div className="flex items-center gap-1.5" aria-label="Application count color scale from zero to maximum">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <span key={ratio} className="h-3.5 w-7 border border-[#DCE3EC]" style={{ backgroundColor: fillForApplications(Math.round(maximum * ratio), maximum) }} />
              ))}
            </div>
            <span>{maximum.toLocaleString('en-IN')} applications</span>
          </div>
          <p className="mt-2 text-[10px] text-[#64748B]">
            Boundary data: <a href="https://github.com/VictorCazanave/svg-maps/tree/master/packages/india" target="_blank" rel="noreferrer" className="underline underline-offset-2">svg-maps India</a> (CC BY 4.0). The source map reflects its published administrative outlines.
          </p>
        </div>

        <div className="min-w-0 border border-[#DCE3EC] bg-white p-4" aria-live="polite">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            {currentLocation ? currentLocation.name : 'Hover or select a state / UT'}
          </p>
          {currentLocation ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
              {[
                ['Total applications', currentLocation.metric.applications],
                ['Verified applications', currentLocation.metric.verified],
                ['Pending verification', currentLocation.metric.pending],
                ['Deficiencies', currentLocation.metric.deficiencies],
                ['Selected applicants', currentLocation.metric.selected],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] leading-4 text-[#64748B]">{label}</dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-[#172033]">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-xs leading-5 text-[#64748B]">Select a region to view its available illustrative metrics.</p>
          )}
          <details className="mt-4 border-t border-[#EEF2F6] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
              View accessible state metrics table
            </summary>
            <div className="mt-2 max-h-64 overflow-auto">
              <table className="w-full min-w-[480px] text-left text-[10px]">
                <caption className="sr-only">Demo application metrics for each state or union territory shown in the India map</caption>
                <thead className="sticky top-0 bg-[#F4F7FA] text-[#64748B]">
                  <tr>{['State / UT', 'Applications', 'Verified', 'Pending', 'Deficiencies', 'Selected'].map((label) => <th key={label} scope="col" className="px-2 py-2 font-semibold">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {locations.map(({ id, name, metric }) => (
                    <tr key={id} className="border-t border-[#EEF2F6]">
                      <th scope="row" className="px-2 py-2 text-left font-semibold">{name}</th>
                      {[metric.applications, metric.verified, metric.pending, metric.deficiencies, metric.selected].map((value, index) => <td key={`${id}-${index}`} className="px-2 py-2 tabular-nums">{value}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
