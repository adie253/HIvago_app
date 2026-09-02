import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { PagedRestaurants, RestaurantFilters } from "../types/api";

export function useRestaurants(filters: RestaurantFilters) {
  return useQuery<PagedRestaurants>({
    queryKey: ["restaurants", filters],
    queryFn: () => 
      api.get("/catalog/restaurants", {
        params: {
          ...filters,
          cuisines: filters.cuisines?.length ? filters.cuisines.join(",") : undefined,
        },
      }),
    placeholderData: keepPreviousData, // smooth UX when filters change
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: filters.lat !== undefined && filters.lng !== undefined,
  });
}
