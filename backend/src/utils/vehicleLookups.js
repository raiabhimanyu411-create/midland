let cachedMotToken = '';
let motTokenExpiresAt = 0;

export function getVehicleLookupStatus() {
  return {
    dvla: Boolean(process.env.DVLA_VES_API_KEY),
    dvsaMot: Boolean(process.env.DVSA_CLIENT_ID && process.env.DVSA_CLIENT_SECRET && process.env.DVSA_TOKEN_URL && process.env.DVSA_API_KEY)
  };
}

export async function lookupVehicleByRegistration(registration) {
  const status = getVehicleLookupStatus();
  if (!status.dvla && !status.dvsaMot) {
    throw lookupError(503, 'Vehicle lookup is not configured. Add DVLA and/or DVSA credentials to the backend environment.');
  }
  const result = { registration, make: '', year: '', fuelType: '', colour: '', euroRating: '', grossWeight: '', motExpiry: '', motStatus: '', motHistory: [] };
  const lookups = [];
  if (status.dvla) lookups.push(fetchDvlaVehicle(registration));
  if (status.dvsaMot) lookups.push(fetchDvsaHistory(registration));
  const responses = await Promise.allSettled(lookups);
  const failed = responses.filter((response) => response.status === 'rejected');
  const vehicles = responses.filter((response) => response.status === 'fulfilled').map((response) => response.value);
  if (!vehicles.length) throw failed[0]?.reason || lookupError(502, 'Vehicle lookup failed. Please enter the details manually.');
  const [dvlaVehicle] = vehicles.filter((item) => item.provider === 'dvla');
  const [dvsaVehicle] = vehicles.filter((item) => item.provider === 'dvsa');
  if (dvlaVehicle) Object.assign(result, dvlaVehicle.data);
  if (dvsaVehicle) {
    Object.assign(result, Object.fromEntries(Object.entries(dvsaVehicle.data).filter(([, value]) => value !== '' && value !== null)));
    if (!result.motHistory.length) result.motHistory = dvsaVehicle.data.motHistory;
    if (!result.motExpiry) result.motExpiry = dvsaVehicle.data.motExpiry;
    if (!result.motStatus) result.motStatus = dvsaVehicle.data.motStatus;
  }
  result.lookupWarnings = failed.map((response) => response.reason?.publicMessage || 'An external vehicle data source was unavailable.');
  return result;
}

async function fetchDvlaVehicle(registration) {
  const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-api-key': process.env.DVLA_VES_API_KEY },
      body: JSON.stringify({ registrationNumber: registration }),
      signal: AbortSignal.timeout(12000)
    }).catch(() => { throw lookupError(502, 'DVLA lookup timed out or could not connect. Please try again or enter the details manually.'); });
  if (!response.ok) throw lookupError(response.status === 404 ? 404 : 502, response.status === 404 ? 'No DVLA vehicle record was found for this registration.' : `DVLA lookup returned ${response.status}. Please try again or enter details manually.`);
  const vehicle = await response.json();
  return {
    provider: 'dvla',
    data: {
      make: vehicle.make || '', year: vehicle.yearOfManufacture ? String(vehicle.yearOfManufacture) : '',
      fuelType: vehicle.fuelType || '', colour: vehicle.colour || '', euroRating: vehicle.euroStatus || '',
      grossWeight: vehicle.revenueWeight ? `${vehicle.revenueWeight} kg` : '', motExpiry: vehicle.motExpiryDate || '',
      motStatus: vehicle.motStatus || ''
    }
  };
}

async function fetchDvsaHistory(registration) {
  const motResponse = await fetch(`https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(registration)}`, {
      headers: { Authorization: `Bearer ${await getMotAccessToken()}`, 'X-API-Key': process.env.DVSA_API_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000)
    }).catch(() => { throw lookupError(502, 'DVSA MOT lookup timed out or could not connect.'); });
  if (!motResponse.ok) throw lookupError(motResponse.status === 404 ? 404 : 502, motResponse.status === 404 ? 'No DVSA MOT history was found for this registration.' : `DVSA MOT lookup returned ${motResponse.status}.`);
  const motData = await motResponse.json();
  const tests = Array.isArray(motData) ? motData.flatMap((item) => item.motTests || item.tests || []) : (motData.motTests || motData.tests || []);
  const sortedTests = tests.slice().sort((a, b) => String(b.completedDate || '').localeCompare(String(a.completedDate || '')));
  const latestTest = sortedTests[0];
  const motHistory = sortedTests.map((test) => ({
      date: test.completedDate || '', result: test.testResult || '', expiryDate: test.expiryDate || '',
      mileage: test.odometerValue || '', mileageUnit: test.odometerUnit || '', defects: test.defects || []
    }));
  return {
    provider: 'dvsa',
    data: {
      make: motData.make || motData.vehicle?.make || '',
      year: motData.manufactureDate ? String(motData.manufactureDate).slice(0, 4) : '',
      fuelType: motData.fuelType || '', colour: motData.primaryColour || '',
      motHistory, motExpiry: latestTest?.expiryDate || '', motStatus: latestTest?.testResult || ''
    }
  };
}

async function getMotAccessToken() {
  if (cachedMotToken && motTokenExpiresAt > Date.now() + 60000) return cachedMotToken;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.DVSA_CLIENT_ID,
    client_secret: process.env.DVSA_CLIENT_SECRET,
    scope: process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default'
  });
  const response = await fetch(process.env.DVSA_TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    signal: AbortSignal.timeout(10000)
  }).catch(() => { throw lookupError(502, 'DVSA authentication failed. Check the configured token URL and credentials.'); });
  if (!response.ok) throw lookupError(502, 'DVSA authentication was rejected. Check the configured credentials.');
  const token = await response.json();
  if (!token.access_token) throw lookupError(502, 'DVSA authentication returned no access token.');
  cachedMotToken = token.access_token;
  motTokenExpiresAt = Date.now() + Math.max(60, Number(token.expires_in || 1200)) * 1000;
  return cachedMotToken;
}

function lookupError(status, publicMessage) {
  const error = new Error(publicMessage);
  error.status = status;
  error.publicMessage = publicMessage;
  return error;
}
