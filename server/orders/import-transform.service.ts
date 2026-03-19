type IntegrationMappingForTransform = {
  orderStatusMapJson: string;
  deliveryTypeMapJson: string;
  warehouseMapJson?: string | null;
  courierMapJson?: string | null;
};

type ExternalOrderPayload = {
  status?: string;
  deliveryType?: string;
  warehouseKey?: string;
  courierKey?: string;
  courierName?: string;
};

function parseJsonMap(jsonString?: string | null): Record<string, string> {
  try {
    if (!jsonString) return {};

    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        result[key] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

export function transformExternalOrderByMapping(
  externalOrder: ExternalOrderPayload,
  mapping: IntegrationMappingForTransform
) {
  const statusMap = parseJsonMap(mapping.orderStatusMapJson);
  const deliveryTypeMap = parseJsonMap(mapping.deliveryTypeMapJson);
  const warehouseMap = parseJsonMap(mapping.warehouseMapJson);
  const courierMap = parseJsonMap(mapping.courierMapJson);

  const externalStatus = String(externalOrder.status || "").trim();
  const externalDeliveryType = String(externalOrder.deliveryType || "").trim();
  const externalWarehouseKey = String(externalOrder.warehouseKey || "").trim();
  const externalCourierKey = String(externalOrder.courierKey || "").trim();
  const externalCourierName = String(externalOrder.courierName || "").trim();

  const normalizedStatus =
    statusMap[externalStatus] || externalStatus || "new";

  const normalizedDeliveryType =
    deliveryTypeMap[externalDeliveryType] || externalDeliveryType || "planned";

  const normalizedWarehouseId =
    warehouseMap[externalWarehouseKey] || null;

  const normalizedCourierExternalId =
    courierMap[externalCourierKey] || externalCourierKey || null;

  return {
    status: normalizedStatus,
    deliveryType: normalizedDeliveryType,
    warehouseId: normalizedWarehouseId,
    courierExternalId: normalizedCourierExternalId,
    courierName: externalCourierName || null,
  };
}