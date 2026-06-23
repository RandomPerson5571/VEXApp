export interface Location {
  venue?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  region?: string | null;
  postcode?: string | null;
  country?: string | null;
  coordinates?: {
    lat: string;
    lon: string;
  } | null;
}