const statusDefaults = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  archived: 'Archived'
};

export function formatTruckStatus(t, status) {
  const key = String(status || 'available').toLowerCase();
  if (!statusDefaults[key]) return status;
  if (key === 'available') return t('truckGrid.available');
  return t(`truckGrid.status.${key}`, { defaultValue: statusDefaults[key] });
}
