import { nanoid } from 'nanoid';

export function createSlug(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-')     
    .replace(/--+/g, '-');    

  return `${cleaned}-${nanoid(6)}`;
}

export function createCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-')     
    .replace(/--+/g, '-');
}