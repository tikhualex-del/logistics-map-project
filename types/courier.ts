export type CourierType = "walk" | "bike" | "car";

export type Courier = {
  id: string;
  companyId: string;
  fullName: string;
  phone: string | null;
  courierType: CourierType;
  maxCapacityPoints: number | null;
  homeAddress: string | null;
  homeLat: number | null;
  homeLon: number | null;
  scheduleJson: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
