import { useState, useEffect } from "react";
import { FixedSizeList } from "react-window";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ListRow } from "../../entities/list-row/ui";
import { getValueLocalStorage } from "../../shared/config/helpers";

const BATCH_SIZE = 20;

interface Item {
  id: number;
  name: string;
  order: number;
}

type LocalStorageListState = {
  selectedIds: number[];
  sortOrder: SortOrder
};

const LOCAL_STORAGE_LIST_STATE = "list_state";

type SortOrder = "asc" | "desc";

export const List: React.FC = () => {
  const listState = {...(getValueLocalStorage<LocalStorageListState>(LOCAL_STORAGE_LIST_STATE) ?? {})}
  const [selected, setSelected] = useState<Set<number>>(
    new Set(
      listState?.selectedIds ?? []
    )
  );
  const [search, setSearch] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>(listState?.sortOrder ?? "asc");

  const [data, setData] = useState<{ totalRecords: number; records: Item[] }>({
    totalRecords: 0,
    records: [],
  });

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_BACKEND_URL}/items?start=0&limit=${BATCH_SIZE}&search=${search}&sortOrder=${sortOrder}`
    )
      .then((res) => res.json())
      .then(({ items, totalCount }) => {
        setData({
          totalRecords: totalCount,
          records: items,
        });
      });
  }, [search, sortOrder]);

  const loadMoreItems = () => {
    fetch(
      `${import.meta.env.VITE_BACKEND_URL}/items?start=${data.records.length}&limit=${BATCH_SIZE}&search=${search}&sortOrder=${sortOrder}`
    )
      .then((res) => res.json())
      .then(({ items: newItems }) => {
        setData((prev) => ({
          ...prev,
          records: [...prev.records, ...newItems],
        }));
      });
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selected);

    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }

    setSelected(newSet);
    localStorage.setItem(
      LOCAL_STORAGE_LIST_STATE,
      JSON.stringify({ selectedIds: Array.from(newSet) })
    );
  };

  const moveItem = async (fromIndex: number, toIndex: number) => {
    try {
      let indexOfItem = data.records.findIndex(
        (item) => item.id === data.records[toIndex].id
      );

      if(sortOrder === "desc") {
        indexOfItem = data.totalRecords - indexOfItem;
      }

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/sort-dnd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.records[fromIndex].id,
          toIndex: indexOfItem,
        }),
      }).then((res) => res.json());

      const newItems = [...data.records];
      const [movedItem] = newItems.splice(fromIndex, 1);
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

    localStorage.setItem(
      LOCAL_STORAGE_LIST_STATE,
      JSON.stringify({
        ...getValueLocalStorage<LocalStorageListState>(LOCAL_STORAGE_LIST_STATE),
        sortOrder: newSortOrder,
      })
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 container mx-auto">
        <h1 className="font-bold text-3xl text-center py-4">Тестовое задание</h1>

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