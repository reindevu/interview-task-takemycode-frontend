import { useState, useEffect, useRef, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ListRow } from "../../entities/list-row/ui";
import {
  getValueLocalStorage,
  type LocalStorageListStateType,
  setValueLocalStorage,
  LOCAL_STORAGE_KEY_LIST_STATE,
} from "../../shared/config/helpers";
import type { SortOrderType } from "../../shared/config/types";

const BATCH_SIZE = 20;

interface Item {
  id: number;
  name: string;
  order: number;
}

export const List: React.FC = () => {
  const listState: LocalStorageListStateType = {
    selectedIds: [],
    sortOrder: "asc",
    ...getValueLocalStorage<LocalStorageListStateType>(
      LOCAL_STORAGE_KEY_LIST_STATE
    ),
  };

  const [selected, setSelected] = useState<Set<number>>(
    new Set(listState.selectedIds)
  );
  const [search, setSearch] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrderType>(
    listState.sortOrder
  );
  const [data, setData] = useState<{ totalRecords: number; records: Item[] }>({
    totalRecords: 0,
    records: [],
  });

  const loadingRef = useRef<boolean>(false);

  const fetchItems = useCallback(
    async (start: number, limit: number) => {
      try {
        if (loadingRef.current) return { records: [], totalRecords: 0 };

        loadingRef.current = true;

        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/list-default?start=${start}&limit=${limit}&search=${search}&sortOrder=${sortOrder}`
        );

        if (!response.ok)
          throw new Error("Произошла ошибка при получении данных.");

        loadingRef.current = false;
        return await response.json();
      } catch (e) {
        console.log(e);
        loadingRef.current = false;
        return { records: [], totalRecords: 0 };
      }
    },
    [search, sortOrder]
  );

  useEffect(() => {
    const handleEffect = async () => {
      const result = await fetchItems(0, BATCH_SIZE);
      setData({
        totalRecords: result.totalRecords,
        records: result.records,
      });
    };
    handleEffect();
  }, [fetchItems]);

  const loadMoreItems = async () => {
    const result = await fetchItems(data.records.length, BATCH_SIZE);
    setData((prev) => ({
      ...prev,
      records: [...prev.records, ...result.records],
    }));
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selected);

    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }

    setSelected(newSet);

    const prevState = getValueLocalStorage<LocalStorageListStateType>(
      LOCAL_STORAGE_KEY_LIST_STATE
    );

    setValueLocalStorage<LocalStorageListStateType>(
      LOCAL_STORAGE_KEY_LIST_STATE,
      {
        selectedIds: Array.from(newSet),
        sortOrder: prevState?.sortOrder ?? "asc",
      }
    );
  };

  const moveItem = async (fromIndex: number, toIndex: number) => {
    try {
      const movedItem = data.records[fromIndex];
      const targetIndex =
        sortOrder === "desc" ? data.totalRecords - toIndex - 1 : toIndex;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/operation-sort`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: movedItem.id,
            toIndex: targetIndex,
          }),
        }
      );

      await response.json();

      const newItems = [...data.records];
      newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      setData((prev) => ({
        ...prev,
        records: newItems,
      }));
    } catch (e) {
      console.log(e);
    }
  };

  const handleSort = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);
    setValueLocalStorage<LocalStorageListStateType>(
      LOCAL_STORAGE_KEY_LIST_STATE,
      {
        selectedIds:
          getValueLocalStorage<LocalStorageListStateType>(
            LOCAL_STORAGE_KEY_LIST_STATE
          )?.selectedIds ?? [],
        sortOrder: newSortOrder,
      }
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 container mx-auto">
        <h1 className="font-bold text-3xl text-center py-4">
          Тестовое задание
        </h1>

        <div className="flex items-center gap-4 my-5">
          <input
            type="text"
            placeholder="Поиск по элементам"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-neutral-100 rounded-md h-9 text-sm px-4 w-full"
          />

          <button onClick={handleSort}>
            ({sortOrder === "asc" ? "↓" : "↑"})
          </button>
        </div>

        <FixedSizeList
          height={600}
          itemCount={data.records.length}
          itemSize={40}
          className="w-full"
          width="100%"
          itemData={{ selected, toggleSelect, items: data.records, moveItem }}
          onItemsRendered={({ visibleStopIndex }) => {
            if (visibleStopIndex === data.records.length - 1) {
              loadMoreItems();
            }
          }}
        >
          {ListRow}
        </FixedSizeList>
      </div>
    </DndProvider>
  );
};
