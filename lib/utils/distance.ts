export function formatDistance(
  meters: number,
  unit: "km" | "mi"
): string {
  if (!Number.isFinite(meters)) {
    return "—";
  }

  if (unit === "mi") {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }

  const kilometers = meters / 1000;
  return `${kilometers.toFixed(2)} km`;
}