'use client';
import { useId } from 'react';
import { Input } from '@/components/ui/input';
/** API suggestions are optional; a learner can enter a real place not in the catalogue. */
export default function LocationInput({ value, options, placeholder, onChange, disabled }: { value: string; options: string[]; placeholder: string; onChange: (value: string) => void; disabled?: boolean }) {
  const listId = useId();
  return <><Input list={listId} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} disabled={disabled} /><datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist></>;
}
