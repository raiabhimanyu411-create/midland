import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { CompareBar } from '../components/CompareBar.jsx';
import { CompareModal } from '../components/CompareModal.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { TruckGrid, TruckGridSkeleton } from '../components/TruckGrid.jsx';
import { TruckStructuredData } from '../components/TruckStructuredData.jsx';
import { trucks as fallbackTrucks } from '../data/siteData.js';
import { api } from '../utils/api.js';
import { demoDataEnabled } from '../utils/runtime.js';
import styles from './TrucksPage.module.css';

const PAGE_SIZE = 6;

export function TrucksPage() {
  const { t, i18n } = useTranslation();
  const filterFieldLabels = {
    make: t('pages.trucks.filters.make'),
    body: t('pages.trucks.filters.body'),
    maxPrice: t('pages.trucks.filters.maxPrice'),
    year: t('pages.trucks.filters.year'),
    mileage: t('pages.trucks.filters.mileage'),
    gearbox: t('pages.trucks.filters.gearbox')
  };

  function formatChipValue(key, value) {
    if (key === 'maxPrice') return t('pages.trucks.filterSelect.under', { amount: Number(value).toLocaleString(i18n.language) });
    if (key === 'year') return t('pages.trucks.filterSelect.yearPlus', { year: value });
    if (key === 'mileage') return t('pages.trucks.filterSelect.underMiles', { amount: Number(value).toLocaleString(i18n.language) });
    return value;
  }

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      make: params.get('make') || '',
      body: params.get('body') || '',
      maxPrice: params.get('maxPrice') || '',
      year: '',
      mileage: '',
      gearbox: ''
    };
  });
  const [sort, setSort] = useState('newest');
  const [trucks, setTrucks] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    makes: demoDataEnabled ? [...new Set(fallbackTrucks.map((truck) => truck.make))] : [],
    bodies: demoDataEnabled ? [...new Set(fallbackTrucks.map((truck) => truck.type))] : [],
    gearboxes: demoDataEnabled ? [...new Set(fallbackTrucks.map((truck) => truck.gearbox))] : []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [compareTrucks, setCompareTrucks] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.getTruckFilters()
      .then((optionData) => { if (active) setFilterOptions(optionData); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTrucks() {
      setLoading(true);
      setError('');
      try {
        const truckData = await api.listTrucks({ ...filters, sort });
        if (!active) return;
        setTrucks(truckData.data || []);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message);
        setTrucks(demoDataEnabled ? fallbackTrucks : []);
      } finally {
        if (active) {
          setLoading(false);
          setVisibleCount(PAGE_SIZE);
        }
      }
    }

    loadTrucks();
    return () => { active = false; };
  }, [filters, sort]);

  const filteredTrucks = useMemo(() => trucks, [trucks]);
  const visibleTrucks = filteredTrucks.slice(0, visibleCount);
  const hasMore = filteredTrucks.length > visibleCount;

  const activeChips = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, text: `${filterFieldLabels[key]}: ${formatChipValue(key, value)}` }));

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearAllFilters() {
    setFilters({ make: '', body: '', maxPrice: '', year: '', mileage: '', gearbox: '' });
  }

  function toggleCompare(truck) {
    setCompareTrucks((current) => {
      const exists = current.some((item) => item.id === truck.id);
      if (exists) return current.filter((item) => item.id !== truck.id);
      if (current.length >= 3) return current;
      return [...current, truck];
    });
  }

  function removeCompare(id) {
    setCompareTrucks((current) => current.filter((item) => item.id !== id));
  }

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.trucks') }]} />
      <PageHero
        eyebrow={t('pages.trucks.hero.eyebrow')}
        title={!loading && trucks.length === 0 && activeChips.length === 0 ? t('pages.trucks.hero.titleEmpty') : t('pages.trucks.hero.title')}
        copy={t('pages.trucks.hero.copy')}
        image="https://images.unsplash.com/photo-1506306460327-3164753b74c7?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={`section ${styles.listingSection}`} data-no-tilt>
        <div className={styles.listingLayout}>
          <aside className={styles.filterSidebar} aria-label={t('pages.trucks.sidebar.eyebrow')}>
            <div className={styles.sidebarHeading}>
              <p className="eyebrow">{t('pages.trucks.sidebar.eyebrow')}</p>
              {activeChips.length > 0 && (
                <span className={styles.activeCount}>{t('pages.trucks.sidebar.activeCount', { count: activeChips.length })}</span>
              )}
            </div>
            <FilterSelect label={t('pages.trucks.filters.make')} value={filters.make} onChange={(value) => updateFilter('make', value)}>
              <option value="">{t('pages.trucks.filterSelect.anyMake')}</option>
              {filterOptions.makes.map((make) => (
                <option key={make}>{make}</option>
              ))}
            </FilterSelect>
            <FilterSelect label={t('pages.trucks.filters.body')} value={filters.body} onChange={(value) => updateFilter('body', value)}>
              <option value="">{t('pages.trucks.filterSelect.anyBody')}</option>
              {filterOptions.bodies.map((body) => (
                <option key={body}>{body}</option>
              ))}
            </FilterSelect>
            <FilterSelect label={t('pages.trucks.filters.maxPrice')} value={filters.maxPrice} onChange={(value) => updateFilter('maxPrice', value)}>
              <option value="">{t('pages.trucks.filterSelect.noLimit')}</option>
              <option value="30000">{t('pages.trucks.filterSelect.under', { amount: Number(30000).toLocaleString(i18n.language) })}</option>
              <option value="50000">{t('pages.trucks.filterSelect.under', { amount: Number(50000).toLocaleString(i18n.language) })}</option>
              <option value="75000">{t('pages.trucks.filterSelect.under', { amount: Number(75000).toLocaleString(i18n.language) })}</option>
              <option value="100000">{t('pages.trucks.filterSelect.underPlus', { amount: Number(100000).toLocaleString(i18n.language) })}</option>
            </FilterSelect>
            <FilterSelect label={t('pages.trucks.filters.year')} value={filters.year} onChange={(value) => updateFilter('year', value)}>
              <option value="">{t('pages.trucks.filterSelect.anyYear')}</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
            </FilterSelect>
            <FilterSelect label={t('pages.trucks.filters.mileage')} value={filters.mileage} onChange={(value) => updateFilter('mileage', value)}>
              <option value="">{t('pages.trucks.filterSelect.anyMileage')}</option>
              <option value="200000">{t('pages.trucks.mileageOptions', { returnObjects: true })[0]}</option>
              <option value="350000">{t('pages.trucks.mileageOptions', { returnObjects: true })[1]}</option>
              <option value="500000">{t('pages.trucks.mileageOptions', { returnObjects: true })[2]}</option>
            </FilterSelect>
            <FilterSelect label={t('pages.trucks.filters.gearbox')} value={filters.gearbox} onChange={(value) => updateFilter('gearbox', value)}>
              <option value="">{t('pages.trucks.filterSelect.anyGearbox')}</option>
              {filterOptions.gearboxes.map((gearbox) => (
                <option key={gearbox}>{gearbox}</option>
              ))}
            </FilterSelect>
            <button type="button" onClick={clearAllFilters}>
              {activeChips.length > 0
                ? t('pages.trucks.clearFiltersCount', { count: activeChips.length })
                : t('pages.trucks.clearFilters')}
            </button>
          </aside>
          <div ref={resultsRef}>
            <div className={styles.listingToolbar}>
              <div>
                <p className="eyebrow">{t('pages.trucks.toolbar.eyebrow')}</p>
                <h2>{t('pages.trucks.toolbar.heading', { count: filteredTrucks.length })}</h2>
              </div>
              <select aria-label={t('pages.trucks.sortAria')} value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">{t('pages.trucks.sortOptions.newest')}</option>
                <option value="year-old">{t('pages.trucks.sortOptions.yearOld')}</option>
                <option value="price-low">{t('pages.trucks.sortOptions.priceLow')}</option>
                <option value="price-high">{t('pages.trucks.sortOptions.priceHigh')}</option>
                <option value="mileage-low">{t('pages.trucks.sortOptions.mileageLow')}</option>
              </select>
            </div>
            {activeChips.length > 0 && (
              <div className={styles.chipRow} aria-label={t('pages.trucks.activeFiltersAria')}>
                {activeChips.map((chip) => (
                  <button type="button" key={chip.key} className={styles.chip} onClick={() => updateFilter(chip.key, '')}>
                    {chip.text}
                    <span aria-hidden="true">&times;</span>
                  </button>
                ))}
                <button type="button" className={styles.chipClearAll} onClick={clearAllFilters}>
                  {t('pages.trucks.clearAll')}
                </button>
              </div>
            )}
            {loading && <TruckGridSkeleton variant="listing" count={PAGE_SIZE} />}
            {!loading && error && <p className={styles.formError}>{error}</p>}
            {!loading && filteredTrucks.length > 0 && (
              <>
                <TruckGrid
                  trucks={visibleTrucks}
                  variant="listing"
                  compareEnabled
                  compareIds={compareTrucks.map((truck) => truck.id)}
                  onToggleCompare={toggleCompare}
                />
                {hasMore && (
                  <div className={styles.loadMoreWrap}>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                    >
                      {t('pages.trucks.loadMore', { count: filteredTrucks.length - visibleCount })}
                    </button>
                  </div>
                )}
                <TruckStructuredData trucks={filteredTrucks} />
              </>
            )}
            {!loading && filteredTrucks.length === 0 && activeChips.length === 0 && (
              <div className={styles.emptyState}>
                <h3>{t('pages.trucks.noStock.heading')}</h3>
                <p>{t('pages.trucks.noStock.copy')}</p>
                <a className="button primary" href="/#stock-alert">{t('pages.trucks.noStock.cta')}</a>{' '}
                <a className="button outline" href="/contact">{t('pages.trucks.noStock.secondaryCta')}</a>
              </div>
            )}
            {!loading && filteredTrucks.length === 0 && activeChips.length > 0 && (
              <div className={styles.emptyState}>
                <h3>{t('pages.trucks.emptyState.heading')}</h3>
                <p>{t('pages.trucks.emptyState.copy')}</p>
                <a className="button primary" href="/contact">{t('pages.trucks.emptyState.cta')}</a>
              </div>
            )}
          </div>
        </div>
      </section>
      <CompareBar
        trucks={compareTrucks}
        onRemove={removeCompare}
        onClear={() => setCompareTrucks([])}
        onOpen={() => setCompareOpen(true)}
      />
      {compareOpen && (
        <CompareModal trucks={compareTrucks} onClose={() => setCompareOpen(false)} onRemove={removeCompare} />
      )}
    </>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}
