// Geofencing utilities
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Check if location is within allowed radius of class location
function isLocationValid(studentLat, studentLng, classLat, classLng, radiusMeters = 100) {
  if (!studentLat || !studentLng) return false;
  const distance = calculateDistance(studentLat, studentLng, classLat, classLng);
  return distance <= radiusMeters;
}

// Export utility functions
module.exports = {
  calculateDistance,
  isLocationValid
};