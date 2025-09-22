"use client";
import React from "react";
import { useMemo } from 'react';
import { listCatalog } from '../domain/substitution';

type CatalogItem = { id: string; name: string; roles: string[] };

export default function OnHandChips({
  ids,
  catalog,
  emptyText = 'No items marked on-hand.'
}: {
  ids: string[];
  catalog?: Map<string, CatalogItem>;
  emptyText?: string;
}) {
  const fallbackMap = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    try { listCatalog().forEach(i => map.set(i.id, i as any)); } catch (err) { console.error('Failed to build catalog map', err); }
    return map;
  }, []);

  const map = catalog || fallbackMap;
  if (!ids?.length) return <p className="text-xs text-gray-600">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map(id => (
        <span key={id} className="px-3 py-1 rounded-full border text-xs bg-green-50 border-green-200 text-green-900">
          {map.get(id)?.name || id}
        </span>
      ))}
    </div>
  );
}

