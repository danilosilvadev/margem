import { feature } from "topojson-client"
import type { Feature, Geometry } from "geojson"
import type { GeometryCollection, Topology } from "topojson-specification"
import { publicUrl } from "@/lib/public-url"

export type CountryFeature = Feature<Geometry, { name?: string }>

let pending: Promise<CountryFeature[]> | null = null

export function loadCountries(): Promise<CountryFeature[]> {
  if (!pending) {
    pending = fetch(publicUrl("geo/countries-110m.json"))
      .then((response) => {
        if (!response.ok) throw new Error("World atlas failed to load")
        return response.json() as Promise<Topology<{ countries: GeometryCollection<{ name?: string }> }>>
      })
      .then((topology) => {
        const collection = feature(topology, topology.objects.countries)
        return collection.features
      })
  }
  return pending
}
