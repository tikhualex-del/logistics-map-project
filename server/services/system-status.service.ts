import { prisma } from "@/lib/prisma";

type SystemStatus = {
  hasIntegration: boolean;
  hasWarehouses: boolean;
  hasOrders: boolean;
  isReady: boolean;
};

export async function getSystemStatus(companyId: string): Promise<SystemStatus> {
  // 1. Проверяем интеграцию
  const integration = await prisma.integration.findFirst({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const hasIntegration = !!integration;

  // 2. Проверяем склады
  const warehousesCount = await prisma.warehouse.count({
    where: {
      companyId,
    },
  });

  const hasWarehouses = warehousesCount > 0;

  // 3. Проверяем заказы
  const ordersCount = await prisma.order.count({
    where: {
      companyId,
    },
  });

  const hasOrders = ordersCount > 0;

  // 4. Готовность системы
  const isReady = hasIntegration && hasWarehouses;

  return {
    hasIntegration,
    hasWarehouses,
    hasOrders,
    isReady,
  };
}