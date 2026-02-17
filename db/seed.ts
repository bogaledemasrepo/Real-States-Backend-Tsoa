// seed.ts
import { db } from ".";
import { faker } from "@faker-js/faker";
import { listings, users } from "./schema";

async function seed() {
  console.log("🌱 Seeding started...");

  // 1. Create a dummy Agent/User first
  const [dummyAgent] = await db
    .insert(users)
    .values({
      name: "John Doe",
      phone: "+251900000000",
      email: "agent@example.com",
      password: "$2b$10$FiYwmX8DzxiXR6dR9kq05uEvtF5u9frfmUg7GFldQ0lEjIuUDO8lK", 
      avatar: faker.image.avatar(),
    })
    .returning();
  if (!dummyAgent) {
    console.error("❌ Failed to create dummy agent.");
    process.exit(1);
  }
  console.log(`👤 Created Agent: ${dummyAgent.name}`);

  // 2. Prepare 50 listings
  const mockListings = Array.from({ length: 50 }).map(() => ({
    title: `${faker.commerce.productAdjective()} ${faker.location.streetAddress()} Villa`,
    price: faker.number.int({ min: 100000, max: 2000000 }).toString(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    numOfBedrooms: faker.number.int({ min: 1, max: 6 }),
    numOfBathrooms: faker.number.int({ min: 1, max: 4 }),
    areaInSqFt: faker.number.int({ min: 500, max: 5000 }).toString(),
    images: [
      faker.image.urlLoremFlickr({ category: "city" }),
      faker.image.urlLoremFlickr({ category: "house" }),
    ],
    facilities: faker.helpers.arrayElements(
      ["Pool", "Gym", "Garage", "Garden", "Security"],
      3,
    ),
    agentId: dummyAgent.id,
    // coordinates for a specific city, e.g., New York area
    location: {
      x: faker.location.longitude({ min: -74.05, max: -73.9 }),
      y: faker.location.latitude({ min: 40.7, max: 40.8 }),
    },
  }));

  // 3. Insert in bulk
  await db.insert(listings).values(mockListings);

  console.log("✅ Successfully seeded 50 listings!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
