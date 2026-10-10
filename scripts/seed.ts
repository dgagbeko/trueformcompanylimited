/**
 * Optional: load a few SAMPLE listings so you can see the site working.
 * Delete them from the back-office before launch.   npm run db:seed
 */
import "dotenv/config";
import postgres from "postgres";

const SAMPLES = [
  { category: "stay", title: "Modern 2-bed apartment", location: "Airport Residential, Accra", region: "Greater Accra", price: 85000, property_type: "Apartment", bedrooms: 2, bathrooms: 2, max_guests: 4, amenities: ["Air conditioning", "Wi-Fi", "Backup generator", "Secure parking"], featured: true },
  { category: "stay", title: "Family house with garden", location: "East Legon, Accra", region: "Greater Accra", price: 140000, property_type: "Entire house", bedrooms: 3, bathrooms: 3, max_guests: 6, amenities: ["Air conditioning", "Wi-Fi", "Garden", "Parking"] },
  { category: "car", title: "Toyota RAV4 2021", location: "Kotoka International Airport, Accra", region: "Greater Accra", price: 75000, make: "Toyota", model: "RAV4", year: 2021, vehicle_type: "SUV", transmission: "Automatic", seats: 5, fuel: "Petrol", amenities: ["Air conditioning", "Bluetooth"], featured: true },
  { category: "car", title: "Toyota Corolla 2020", location: "Osu, Accra", region: "Greater Accra", price: 45000, make: "Toyota", model: "Corolla", year: 2020, vehicle_type: "Sedan", transmission: "Automatic", seats: 5, fuel: "Petrol", amenities: ["Air conditioning"] },
  { category: "land", title: "Residential plot", location: "Oyarifa, Accra", region: "Greater Accra", price: 18000000, plot_size: "100 × 70 ft", land_use: "Residential", title_type: "Indenture", amenities: [], featured: true },
  { category: "house", title: "4-bed detached house", location: "East Legon, Accra", region: "Greater Accra", price: 340000000, property_type: "Detached house", bedrooms: 4, bathrooms: 5, plot_size: "1 plot", title_type: "Land title certificate", amenities: ["Boys' quarters", "Gated", "Borehole"], featured: true },
] as const;

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  for (const s of SAMPLES) {
    const slug = `${s.title}-${s.location}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const row = {
      category: s.category, title: s.title, slug, location: s.location, region: s.region, price: s.price,
      status: "published", featured: "featured" in s ? s.featured : false,
      description: "SAMPLE LISTING — replace or delete from the back-office before launch.",
      property_type: "property_type" in s ? s.property_type : null,
      bedrooms: "bedrooms" in s ? s.bedrooms : null,
      bathrooms: "bathrooms" in s ? s.bathrooms : null,
      max_guests: "max_guests" in s ? s.max_guests : null,
      make: "make" in s ? s.make : null, model: "model" in s ? s.model : null, year: "year" in s ? s.year : null,
      vehicle_type: "vehicle_type" in s ? s.vehicle_type : null, transmission: "transmission" in s ? s.transmission : null,
      seats: "seats" in s ? s.seats : null, fuel: "fuel" in s ? s.fuel : null,
      plot_size: "plot_size" in s ? s.plot_size : null, land_use: "land_use" in s ? s.land_use : null, title_type: "title_type" in s ? s.title_type : null,
      amenities: [...s.amenities],
    };
    await sql`insert into listings ${sql(row)} on conflict (slug) do nothing`;
  }
  console.log(`Loaded ${SAMPLES.length} sample listings.`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
