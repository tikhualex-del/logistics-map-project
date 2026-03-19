import { prisma } from "@/lib/prisma";
import { transformExternalOrderByMapping } from "@/server/orders/import-transform.service";

export type ExternalImportOrderInput = {
  externalId?: string;
  title?: string;
  status?: string;
  deliveryType?: string;
  warehouseKey?: string;
  courierKey?: string;
  courierName?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type ImportSingleOrderResult = {
  success: boolean;
  action?: "created" | "updated";
  orderId?: string;
  externalId: string | null;
  message?: string;
};

async function getIntegrationAndMapping(companyId: string, integrationId: string) {
  const integration = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      companyId,
      isActive: true,
    },
  });

  if (!integration) {
    throw new Error("Integration not found in current company");
  }

  const mapping = await prisma.integrationMapping.findFirst({
    where: {
      companyId,
      integrationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!mapping) {
    throw new Error("Integration mapping not found for current company");
  }

  return { integration, mapping };
}

export async function importSingleOrderForCompany(params: {
  companyId: string;
  integrationId: string;
  rawOrder: ExternalImportOrderInput;
}): Promise<ImportSingleOrderResult> {
  const { companyId, integrationId, rawOrder } = params;

  const externalId = String(rawOrder.externalId || "").trim();
  const title = String(rawOrder.title || "").trim();
  const status = String(rawOrder.status || "").trim();
  const deliveryType = String(rawOrder.deliveryType || "").trim();
  const warehouseKey = String(rawOrder.warehouseKey || "").trim();
  const courierKey = String(rawOrder.courierKey || "").trim();
  const courierName = String(rawOrder.courierName || "").trim();
  const address = String(rawOrder.address || "").trim();

  const latitudeRaw = rawOrder.latitude;
  const longitudeRaw = rawOrder.longitude;

  const latitude =
    latitudeRaw === undefined ||
    latitudeRaw === null ||
    String(latitudeRaw).trim() === ""
      ? null
      : Number(latitudeRaw);

  const longitude =
    longitudeRaw === undefined ||
    longitudeRaw === null ||
    String(longitudeRaw).trim() === ""
      ? null
      : Number(longitudeRaw);

  if (!externalId || !title) {
    return {
      success: false,
      externalId: externalId || null,
      message: "externalId and title are required",
    };
  }

  if (
    (latitude !== null && Number.isNaN(latitude)) ||
    (longitude !== null && Number.isNaN(longitude))
  ) {
    return {
      success: false,
      externalId,
      message: "latitude and longitude must be valid numbers",
    };
  }

  const { mapping } = await getIntegrationAndMapping(companyId, integrationId);

  const transformed = transformExternalOrderByMapping(
    {
      status,
      deliveryType,
      warehouseKey,
      courierKey,
      courierName,
    },
    mapping
  );

  if (transformed.warehouseId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: transformed.warehouseId,
        companyId,
        isActive: true,
      },
    });

    if (!warehouse) {
      return {
        success: false,
        externalId,
        message: "Mapped warehouse not found in current company",
      };
    }
  }

  const existingOrder = await prisma.order.findFirst({
    where: {
      companyId,
      integrationId,
      externalId,
    },
    select: {
      id: true,
    },
  });

  const order = await prisma.order.upsert({
    where: {
      companyId_integrationId_externalId: {
        companyId,
        integrationId,
        externalId,
      },
    },
    update: {
      warehouseId: transformed.warehouseId,
      title,
      status: transformed.status,
      deliveryType: transformed.deliveryType,
      address: address || "",
      latitude,
      longitude,
      courierExternalId: transformed.courierExternalId,
      courierName: transformed.courierName,
    },
    create: {
      companyId,
      integrationId,
      warehouseId: transformed.warehouseId,
      externalId,
      title,
      status: transformed.status,
      deliveryType: transformed.deliveryType,
      address: address || "",
      latitude,
      longitude,
      courierExternalId: transformed.courierExternalId,
      courierName: transformed.courierName,
    },
    select: {
      id: true,
    },
  });

  return {
    success: true,
    action: existingOrder ? "updated" : "created",
    orderId: order.id,
    externalId,
  };
}

export async function importBatchOrdersForCompany(params: {
  companyId: string;
  integrationId: string;
  orders: ExternalImportOrderInput[];
}) {
  const { companyId, integrationId, orders } = params;

  await getIntegrationAndMapping(companyId, integrationId);

  let created = 0;
  let updated = 0;
  let failed = 0;

  const results: ImportSingleOrderResult[] = [];

  for (const rawOrder of orders) {
    try {
      const result = await importSingleOrderForCompany({
        companyId,
        integrationId,
        rawOrder,
      });

      results.push(result);

      if (!result.success) {
        failed += 1;
      } else if (result.action === "created") {
        created += 1;
      } else if (result.action === "updated") {
        updated += 1;
      }
    } catch (error) {
      failed += 1;
      results.push({
        success: false,
        externalId:
          rawOrder && typeof rawOrder.externalId === "string"
            ? rawOrder.externalId
            : null,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    summary: {
      total: orders.length,
      created,
      updated,
      failed,
    },
    results,
  };
}