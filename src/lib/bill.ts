export interface Person {
  id: string;
  name: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // person IDs
}

export interface BillSummary {
  personId: string;
  personName: string;
  items: { name: string; amount: number }[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}

export const TAX_RATE = 0.1; // PB1 10%
export const SERVICE_CHARGE_RATE = 0.05; // 5%

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateSummaries(
  persons: Person[],
  items: BillItem[]
): BillSummary[] {
  return persons.map((person) => {
    const personItems: { name: string; amount: number }[] = [];

    items.forEach((item) => {
      if (item.assignedTo.includes(person.id)) {
        const share = item.price / item.assignedTo.length;
        personItems.push({ name: item.name, amount: share });
      }
    });

    const subtotal = personItems.reduce((sum, i) => sum + i.amount, 0);
    const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
    const tax = (subtotal + serviceCharge) * TAX_RATE;
    const total = subtotal + serviceCharge + tax;

    return {
      personId: person.id,
      personName: person.name,
      items: personItems,
      subtotal,
      tax,
      serviceCharge,
      total,
    };
  });
}
