// Haversine formula để tính khoảng cách giữa 2 điểm (lat/lng)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Tìm chi nhánh gần nhất dựa trên tọa độ
export function findNearestBranch(
  buyerLat: number,
  buyerLng: number,
  branches: Array<{
    id: string;
    name: string;
    latitude: string | number | null;
    longitude: string | number | null;
    address: string;
    city: string;
  }>,
) {
  const branchesWithDistance = branches
    .filter((b) => b.latitude && b.longitude)
    .map((branch) => {
      const lat = typeof branch.latitude === "string" ? parseFloat(branch.latitude) : branch.latitude;
      const lng = typeof branch.longitude === "string" ? parseFloat(branch.longitude) : branch.longitude;
      const distance = calculateDistance(buyerLat, buyerLng, lat || 0, lng || 0);
      return {
        ...branch,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance);

  return branchesWithDistance[0] || null;
}

// Mock GHN API - tính phí ship
export function calculateShippingFee(
  weight: number,
  distance: number,
  _serviceType: string = "standard",
): number {
  // Mock: 5000 VND base + 1000 VND per km + 500 VND per 100g
  const baseFee = 5000;
  const distanceFee = distance * 1000;
  const weightFee = Math.ceil(weight / 100) * 500;
  return baseFee + distanceFee + weightFee;
}

// Mock GHN API - tính estimated delivery
export function calculateEstimatedDelivery(distance: number): Date {
  // Mock: 1-3 ngày tùy khoảng cách
  const days = distance > 100 ? 3 : distance > 50 ? 2 : 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
