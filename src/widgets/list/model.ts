import type { SortOrderType } from "../../shared/config/types";

export const BATCH_SIZE = 20;

export interface ListItem {
  id: number;
  name: string;
  order: number;
}

export const getSortQuery = async (): Promise<SortOrderType> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/getSort`);

  if (!response.ok) throw new Error("Произошла ошибка при получении данных.");

  const result = await response.json();

  return result.sortOrder as SortOrderType;
};

export const updateSortRowQuery = async (
  id: number,
  targetOrder: number
): Promise<void> => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/updateSortRow`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        targetOrder,
      }),
    }
  );

  if (!response.ok)
    throw new Error("Произошла ошибка при обновлении сортировки.");

  await response.json();
};

export const checkRowQuery = async (id: number): Promise<Set<number>> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/checkRow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: id,
    }),
  });

  if (!response.ok)
    throw new Error("Произошла ошибка при обновлении сортировки.");

  const result = await response.json();

  return new Set(result.checkedIds ?? []);
};

export const getListCheckedQuery = async (): Promise<Set<number>> => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/getListChecked`
  );

  if (!response.ok) throw new Error("Произошла ошибка при получении данных.");

  const result = await response.json();

  return new Set(result.checkedIds ?? []);
};

export const getListQuery = async (
  start: number,
  limit: number,
  search: string,
  sortOrder: SortOrderType
): Promise<{ records: ListItem[]; totalRecords: number }> => {
  const response = await fetch(
    `${
      import.meta.env.VITE_BACKEND_URL
    }/getList?start=${start}&limit=${limit}&search=${search}&sortOrder=${sortOrder}`
  );

  if (!response.ok) throw new Error("Произошла ошибка при получении данных.");

  return await response.json();
};
