export type SectionItem = { id: string; label: string; price: number }

/**
 * Every line on the receipt, in order. Clicking a line opens the pop-up for
 * that `id` (see App.tsx), the same one its basket item opens.
 */
export const ITEMS: SectionItem[] = [
  { id: 'about', label: 'About Us', price: 2.49 },
  { id: 'how-it-works', label: 'How it Works', price: 1.99 },
  { id: 'data', label: 'Data & Visuals', price: 4.98 },
  { id: 'locations', label: 'Locations', price: 3.25 },
  { id: 'contact', label: 'Contact Us', price: 5.5 },
]
