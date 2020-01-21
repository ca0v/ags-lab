import { Geometry } from "./Geometry";

export type SearchResultTypes = Array<
  "address" | "business" | "park" | "political"
>;

export type SearchResultItem = {
  key: string;
  address: string;
  address_type: SearchResultTypes;
  location: Geometry;
};
