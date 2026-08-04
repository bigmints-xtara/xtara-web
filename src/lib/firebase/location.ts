import { xtaraApi } from '@/lib/api/client';

export interface LocationState {
  name: string;
  districts: string[];
  majorCities: string[];
}

const indiaStatesAndTerritories = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export async function getStates(): Promise<string[]> {
  const response = await xtaraApi.get<{ items?: string[] }>('/locations/states').catch(() => ({ items: [] }));
  return response.items?.length ? response.items : indiaStatesAndTerritories;
}

export interface StateDetails {
  districts: string[];
  cities: string[];
  unavailable?: boolean;
}

export async function getStateDetails(stateName: string): Promise<StateDetails> {
  return xtaraApi
    .get<{ districts: string[]; cities: string[] }>(`/locations/states?state=${encodeURIComponent(stateName)}`)
    .catch(() => ({ districts: [], cities: [], unavailable: true }));
}
