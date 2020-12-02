import { EventEmitter2 } from 'eventemitter2';
import React, { useContext, useEffect, useRef, useState } from 'react';

// This context provides data about the actual rendered file.
// It's data is filled by the deepest renderer.

export interface IRenderStackItem {
  depth: number;
  id: string;
  file: gapi.client.drive.File;
}

function buildStackKey(depth: number, id: string) {
  return `${id}_${depth}`;
}

export class RenderStack {
  public stack: Record<string, IRenderStackItem> = {};
  public eventBus = new EventEmitter2();

  public push(item: IRenderStackItem) {
    const key = buildStackKey(item.depth, item.id);
    if (this.stack[key]) {
      console.error('RenderStack push meet identical (id, depth)', item.id, item.depth, item);
      return;
    }
    this.stack[key] = { ...item };
    this.eventBus.emit('change');
  }

  public pop(depth: number, id: string) {
    const key = buildStackKey(depth, id);
    if (!this.stack[key]) {
      console.warn('RenderStack skipped non-exist stack item (id, depth)', id, depth);
      return;
    }
    delete this.stack[key];
    this.eventBus.emit('change');
  }

  public getInMostRender(): IRenderStackItem | undefined {
    const items = Object.values(this.stack);
    if (items.length === 0) {
      return undefined;
    }
    let maxItem = items[0];
    for (const item of items) {
      if (item.depth > maxItem.depth) {
        maxItem = item;
      }
    }
    return maxItem;
  }

  public getOutMostRender(): IRenderStackItem | undefined {
    const items = Object.values(this.stack);
    if (items.length === 0) {
      return undefined;
    }
    let minItem = items[0];
    for (const item of items) {
      if (item.depth < minItem.depth) {
        minItem = item;
      }
    }
    return minItem;
  }
}

const Ctx = React.createContext<RenderStack>(new RenderStack());

export function RenderStackProvider({ children }) {
  const rs = useRef(new RenderStack());
  return <Ctx.Provider value={rs.current}>{children}</Ctx.Provider>;
}

export function useRenderStack() {
  return useContext(Ctx);
}

export interface IRenderState {
  outMost?: IRenderStackItem;
  inMost?: IRenderStackItem;
}

export function useRender(): IRenderState {
  const rs = useRenderStack();
  const [data, setData] = useState<IRenderState>({});

  useEffect(() => {
    function listener() {
      setData({
        outMost: rs.getOutMostRender(),
        inMost: rs.getInMostRender(),
      });
    }
    rs.eventBus.addListener('change', listener);
    return () => {
      rs.eventBus.removeListener('change', listener);
    };
  }, [rs]);

  return data;
}

export interface IManagedRenderStackProps {
  depth: number;
  id: string;
  file?: gapi.client.drive.File;
}

// A hook automatically push or pop the render stack when file changes.
export function useManagedRenderStack({ depth, id, file }: IManagedRenderStackProps) {
  const rs = useRenderStack();
  useEffect(() => {
    if (!file) {
      return;
    }
    rs.push({
      depth,
      id,
      file,
    });
    return () => {
      rs.pop(depth, id);
    };
    // Ignore depth, id, rs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);
}
