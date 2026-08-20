import { createContext, useContext, useMemo, useState } from 'react';

const FleetContext = createContext(null);

const DEFAULT_FILTERS = { dept: 'all', brand: 'all', weight: 'all', status: 'all', year: 'all', gara: 'all', from: '', to: '' };

export function weightBucket(loadCapacity) {
  const tons = parseFloat(String(loadCapacity || '').replace(',', '.')) / 1000;
  if (!tons) return 'Đầu kéo';
  if (tons < 2) return '< 2 tấn';
  if (tons < 5) return '2 – 5 tấn';
  if (tons < 10) return '5 – 10 tấn';
  return '≥ 10 tấn';
}

export function FleetProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [compareSel, setCompareSel] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filterBarOpen, setFilterBarOpenState] = useState(() => localStorage.getItem('fleet_filterbar_open') === '1');

  function setFilterBarOpen(next) {
    setFilterBarOpenState((cur) => {
      const value = typeof next === 'function' ? next(cur) : next;
      localStorage.setItem('fleet_filterbar_open', value ? '1' : '0');
      return value;
    });
  }

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }
  function toggleCompare(plate) {
    setCompareSel((sel) => {
      if (sel.includes(plate)) return sel.filter((p) => p !== plate);
      if (sel.length >= 3) return sel;
      return [...sel, plate];
    });
  }
  function applyVehicleFilters(vehicles) {
    return vehicles.filter(
      (v) =>
        (filters.dept === 'all' || v.manager_unit === filters.dept) &&
        (filters.brand === 'all' || v.brand === filters.brand) &&
        (filters.weight === 'all' || weightBucket(v.load_capacity) === filters.weight) &&
        (filters.status === 'all' || v.status === filters.status) &&
        (filters.year === 'all' || String(v.manufacture_year) === filters.year)
    );
  }

  const hasFilters = Object.entries(filters).some(([k, v]) => v && v !== 'all' && v !== '' && DEFAULT_FILTERS[k] !== v);

  const value = useMemo(
    () => ({
      filters,
      setFilter,
      clearFilters,
      hasFilters,
      compareSel,
      toggleCompare,
      compareOpen,
      setCompareOpen,
      importOpen,
      setImportOpen,
      filterBarOpen,
      setFilterBarOpen,
      applyVehicleFilters,
    }),
    [filters, compareSel, compareOpen, importOpen, filterBarOpen, hasFilters]
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}
