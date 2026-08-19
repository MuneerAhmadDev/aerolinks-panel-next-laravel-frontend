// Soft supplier-type filtering for booking forms: suppliers tagged with the
// relevant type (flight/hotel/visa/transport/Activities) are surfaced first
// under a "Recommended" group, but every supplier stays selectable — a
// missing/incomplete type tag on a supplier should never hide it from staff.

export interface SupplierTypeRef {
  id: number;
  name: string;
}

export interface SupplierWithTypes {
  id: number;
  name: string;
  supplier_types?: SupplierTypeRef[];
  [key: string]: any;
}

export function supplierMatchesType(supplier: SupplierWithTypes, typeName: string): boolean {
  if (!supplier?.supplier_types?.length) return false;
  const target = typeName.trim().toLowerCase();
  return supplier.supplier_types.some((t) => t.name?.trim().toLowerCase() === target);
}

/** Matching-type suppliers first, so they appear under the "Recommended" group when used with `groupBy`. */
export function sortSuppliersByType<T extends SupplierWithTypes>(suppliers: T[], typeName: string): T[] {
  if (!Array.isArray(suppliers)) return [];
  return [...suppliers].sort((a, b) => {
    const aMatch = supplierMatchesType(a, typeName);
    const bMatch = supplierMatchesType(b, typeName);
    if (aMatch === bMatch) return 0;
    return aMatch ? -1 : 1;
  });
}

export function supplierGroupLabel(supplier: SupplierWithTypes, typeName: string): string {
  return supplierMatchesType(supplier, typeName) ? "Recommended" : "Other Suppliers";
}
