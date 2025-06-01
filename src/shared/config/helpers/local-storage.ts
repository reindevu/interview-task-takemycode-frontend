import type { SortOrderType } from "../types";

export type LocalStorageListStateType = {
  selectedIds: number[];
  sortOrder: SortOrderType;
};

export const LOCAL_STORAGE_KEY_LIST_STATE = "list_state";

export const setValueLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getValueLocalStorage = <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  return null;
};
