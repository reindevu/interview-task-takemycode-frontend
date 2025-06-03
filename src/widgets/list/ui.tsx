import { useState, useEffect, useRef } from "react";
import { FixedSizeList } from "react-window";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import { ListRow } from "../../entities/list-row/ui";
import type { SortOrderType } from "../../shared/config/types";
import {
  BATCH_SIZE,
  checkRowQuery,
  getListCheckedQuery,
  getListQuery,
  getSortQuery,
  updateSortOrderQuery,
  updateSortRowQuery,
  type ListItem,
} from "./model";
import { useDebounce } from "../../shared/config/hook";

export const List: React.FC = () => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrderType>("asc");
  const [data, setData] = useState<{
    totalRecords: number;
    records: ListItem[];
  }>({
    totalRecords: 0,
    records: [],
  });

  const loadingRef = useRef<boolean>(false);

  const fetchItems = async (start: number, limit: number) => {
    try {
      if (loadingRef.current) return { records: [], totalRecords: 0 };

      loadingRef.current = true;
      const result = await getListQuery(start, limit, search);
      loadingRef.current = false;

      return result;
    } catch (e) {
      console.log(e);
      loadingRef.current = false;
      return { records: [], totalRecords: 0 };
    }
  };

  const ititData = async () => {
    try {
      const resultSort = await getSortQuery();
      const resultCheckedList = await getListCheckedQuery();

      setSelected(resultCheckedList);
      setSortOrder(resultSort);
    } catch (e) {
      console.log(e);
    }
  };

  const loadMoreItems = async () => {
    const result = await fetchItems(data.records.length, BATCH_SIZE);
    setData((prev) => ({
      ...prev,
      records: [...prev.records, ...result.records],
    }));
  };

  const toggleSelect = async (id: number) => {
    try {
      const result = await checkRowQuery(id);

      setSelected(result);
    } catch (e) {
      console.log(e);
    }
  };

  const moveItem = async (fromIndex: number, toIndex: number) => {
    try {
      const movedItem = data.records[fromIndex];
      const toItem = data.records[toIndex];

      const newItems = [...data.records];
      newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      setData((prev) => ({
        ...prev,
        records: newItems,
      }));

      await updateSortRowQuery(movedItem.id, toItem.id);
    } catch (e) {
      console.log(e);
    }
  };

  const handleSort = async () => {
    try {
      const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      await updateSortOrderQuery(newSortOrder);
      setSortOrder(newSortOrder);
    } catch (e) {
      console.log(e);
    }
  };

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    ititData();
  }, []);

  useEffect(() => {
    const handleEffect = async () => {
      try {
        const result = await fetchItems(0, BATCH_SIZE);
        setData({
          totalRecords: result.totalRecords,
          records: result.records,
        });
      } catch (e) {
        console.log(e);
      }
    };

    handleEffect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder, debouncedSearch]);

  return (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? { delayTouchStart: 200 } : {}}
    >
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
