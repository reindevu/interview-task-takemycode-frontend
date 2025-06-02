import { type FC } from "react";
import { useDrag, useDrop } from "react-dnd";

const ItemType = "ROW";

interface Item {
  id: number;
  name: string;
  order: number;
}

type Props = {
  index: number;
  style: React.CSSProperties;
  data: {
    selected: Set<number>;
    toggleSelect: (id: number) => void;
    items: Item[];
    moveItem: (fromIndex: number, toIndex: number, id: number) => void;
  };
};

export const ListRow: FC<Props> = ({ index, style, data }) => {
  const { selected, toggleSelect, items, moveItem } = data;
  const actualItem = items[index];

  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: ItemType,
    drop: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index, actualItem.id);
      }
    },
  });


  return (
    <div
      ref={(node) => {
        dragRef(dropRef(node));
      }}
      className="border-b border-b-neutral-200 w-full last:border-0 flex items-center gap-2"
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
    >
      <input
        type="checkbox"
        checked={selected.has(actualItem.id)}
        onChange={() => toggleSelect(actualItem.id)}
      />

      <span className="text-sm">{actualItem.name}</span>
    </div>
  );
};
