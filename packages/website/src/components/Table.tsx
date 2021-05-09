import { usePersistFn } from 'ahooks';
import {
  ColumnActionsMode,
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  IDetailsListProps,
  SelectionMode,
} from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import styles from './Table.module.scss';

export const MemoDetailsList = React.memo(DetailsList);

function copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items
    .slice(0)
    .sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}

export interface ITableProps extends IDetailsListProps {
  extendLastColumn?: boolean;

  // Handle sort
  orderBy?: string;
  desc?: boolean;
  onChangeOrder?: (orderBy: string, desc: boolean) => void;

  // Event triggered when a row is clicked.
  onRowClicked?: (item: any, itemIndex: number, ev: React.MouseEvent<HTMLElement>) => void;
}

function useRenderClickableRow(onRowClicked) {
  return useCallback(
    (props, defaultRender) => {
      if (!props) {
        return null;
      }
      return (
        <div
          className={styles.clickableTableRow}
          onClick={(ev) => onRowClicked?.(props.item, props.itemIndex, ev)}
        >
          {defaultRender!(props)}
        </div>
      );
    },
    [onRowClicked]
  );
}

function dummyColumn(): IColumn {
  return {
    name: '',
    key: 'dummy',
    minWidth: 28,
    maxWidth: 28,
    onRender: (_rec) => null,
  };
}

export function Table(props: ITableProps) {
  const {
    className,
    extendLastColumn,
    orderBy,
    desc = true,
    onChangeOrder,
    onRowClicked,
    columns,
    items,
    ...restProps
  } = props;
  const renderClickableRow = useRenderClickableRow(onRowClicked);

  const onColumnClick = usePersistFn((_ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
    if (!onChangeOrder) {
      return;
    }
    if (column.key === orderBy) {
      onChangeOrder(orderBy, !desc);
    } else {
      onChangeOrder(column.key, true);
    }
  });

  const finalColumns = useMemo(() => {
    const newColumns: IColumn[] = (columns ?? []).map((c) => ({
      ...c,
      isResizable: c.isResizable ?? true,
      isSorted: c.key === orderBy,
      isSortedDescending: desc,
      onColumnClick,
      columnActionsMode: c.columnActionsMode || ColumnActionsMode.disabled,
    }));
    if (!extendLastColumn) {
      newColumns.push(dummyColumn());
    }
    return newColumns;
  }, [onColumnClick, columns, orderBy, desc, extendLastColumn]);

  const finalItems = useMemo(() => {
    let newItems = items || [];
    const curColumn = finalColumns.find((col) => col.key === orderBy);
    if (curColumn) {
      newItems = copyAndSort(newItems, curColumn.fieldName!, curColumn.isSortedDescending);
    }
    return newItems;
  }, [items, orderBy, finalColumns]);

  return (
    <MemoDetailsList
      selectionMode={SelectionMode.none}
      constrainMode={ConstrainMode.unconstrained}
      layoutMode={DetailsListLayoutMode.justified}
      onRenderRow={onRowClicked ? renderClickableRow : undefined}
      columns={finalColumns}
      items={finalItems}
      {...restProps}
    />
  );
}
