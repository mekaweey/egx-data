/**
 * #16 Supply Chain Mapping: تأثير مشاكل المورد على الشركة.
 */
export interface SupplyChainNode { symbol: string; suppliers: string[]; weight: number }

export function propagateSupplyChainRisk(node: SupplyChainNode, supplierRisk: Map<string, number>): number {
  if (!node.suppliers.length) return 0;
  const total = node.suppliers.reduce((s, sup) => s + (supplierRisk.get(sup) ?? 0), 0);
  return (total / node.suppliers.length) * node.weight;
}