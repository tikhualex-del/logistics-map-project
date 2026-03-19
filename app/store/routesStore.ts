"use client";

import { create } from "zustand";

export type AppRouteOrder = {
  id: number;
  title: string;
  status: string;
  textAddress?: string | null;
  coordinates: [number, number];
  deliveryFrom?: string | null;
  deliveryTo?: string | null;
  courierName?: string | null;
  deliveryTypeCode?: string;
};

export type AppRouteStatus = "draft" | "assigned" | "active" | "completed";

export type AppRoute = {
  id: string;
  name: string;
  date: string | null;
  color: string;
  status: AppRouteStatus;
  courierId?: string | null;
  courierName?: string | null;
  orders: AppRouteOrder[];
  createdAt: number;
};

type CreateRouteInput = {
  name?: string;
  date: string | null;
  color: string;
  orders: AppRouteOrder[];
};

type RoutesStore = {
  routes: AppRoute[];

  addRoute: (input: CreateRouteInput) => AppRoute;
  updateRoute: (routeId: string, patch: Partial<AppRoute>) => void;
  deleteRoute: (routeId: string) => void;

  assignCourier: (
    routeId: string,
    courier: { id: string | null; name: string | null }
  ) => void;

  clearRoutes: () => void;
};

function buildRouteName(routeCount: number) {
  return `Маршрут #${routeCount + 1}`;
}

export const ROUTE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#14b8a6",
  "#f97316",
];

export function getNextRouteColor(index: number) {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

export const useRoutesStore = create<RoutesStore>((set, get) => ({
  routes: [],

  addRoute: (input) => {
    const currentRoutes = get().routes;

    const newRoute: AppRoute = {
      id: `route-${Date.now()}`,
      name: input.name || buildRouteName(currentRoutes.length),
      date: input.date,
      color: input.color,
      status: "draft",
      courierId: null,
      courierName: null,
      orders: input.orders,
      createdAt: Date.now(),
    };

    set((state) => ({
      routes: [newRoute, ...state.routes],
    }));

    return newRoute;
  },

  updateRoute: (routeId, patch) => {
    set((state) => ({
      routes: state.routes.map((route) =>
        route.id === routeId ? { ...route, ...patch } : route
      ),
    }));
  },

  deleteRoute: (routeId) => {
    set((state) => ({
      routes: state.routes.filter((route) => route.id !== routeId),
    }));
  },

  assignCourier: (routeId, courier) => {
    set((state) => ({
      routes: state.routes.map((route) =>
        route.id === routeId
          ? {
              ...route,
              courierId: courier.id,
              courierName: courier.name,
              status: courier.id ? "assigned" : "draft",
            }
          : route
      ),
    }));
  },

  clearRoutes: () => {
    set({ routes: [] });
  },
}));