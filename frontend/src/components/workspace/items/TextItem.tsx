'use client';

import { Text } from 'react-konva';
import { WorkspaceItem } from '@/types/workspace';

interface TextItemProps {
  item: WorkspaceItem;
  isSelected: boolean;
  isEditing?: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<WorkspaceItem>) => void;
}

export default function TextItem({
  item,
  isEditing = false,
  onSelect,
  onChange,
}: TextItemProps) {
  const { id, ...props } = item;

  return (
    <Text
      key={id}
      id={id}
      {...props}
      visible={!isEditing}
      draggable
      onClick={onSelect}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    />
  );
}
