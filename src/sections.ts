export type SectionItem = { id: string; label: string; price: number }

/**
 * Every line on the receipt, in order. Each `id` must match the `id` of a
 * <section> on the page — the line prints when that section scrolls into view.
 *
 * When you build the next page, add its section to App.tsx and uncomment
 * (or add) its line here.
 */
export const ITEMS: SectionItem[] = [
  { id: 'about', label: 'About Us', price: 2.49 },
  { id: 'how-it-works', label: 'How it Works', price: 1.99 },
  // { id: 'data', label: 'Data & Visuals', price: 4.98 },
  // { id: 'locations', label: 'Locations', price: 3.25 },
  // { id: 'contact', label: 'Contact Us', price: 5.5 },
]
