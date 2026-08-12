import {
  getPostsCollection,
  getUsersCollection,
} from "@/app/utils/database";
import {
  getCountryDisplayName,
  normalizeCountryKey,
} from "@/app/utils/discovery";
import { PRESENCE_ONLINE_THRESHOLD_MS } from "@/app/utils/presence";

export const runtime = "nodejs";

function mergeCountryRows(rows) {
  const countries = new Map();

  for (const row of rows) {
    const countryName = getCountryDisplayName(row?._id);
    const countryKey = normalizeCountryKey(countryName);

    if (!countryKey || !countryName) {
      continue;
    }

    const current = countries.get(countryKey) || {
      key: countryKey,
      country: countryName,
      postsCount: 0,
      cities: new Set(),
    };

    current.postsCount += Number(row?.postsCount) || 0;

    for (const city of Array.isArray(row?.cities) ? row.cities : []) {
      const normalizedCity = String(city || "").trim().toLocaleLowerCase("ro-RO");

      if (normalizedCity) {
        current.cities.add(normalizedCity);
      }
    }

    countries.set(countryKey, current);
  }

  return [...countries.values()]
    .sort(
      (first, second) =>
        second.postsCount - first.postsCount ||
        first.country.localeCompare(second.country, "ro-RO")
    )
    .map((country) => ({
      key: country.key,
      country: country.country,
      postsCount: country.postsCount,
      citiesCount: country.cities.size,
    }));
}

export async function GET() {
  try {
    const [usersCollection, postsCollection] = await Promise.all([
      getUsersCollection(),
      getPostsCollection(),
    ]);

    const onlineSince = new Date(
      Date.now() - PRESENCE_ONLINE_THRESHOLD_MS
    );

    const [activeMembers, accountsCreated, postsPublished, countryRows] =
      await Promise.all([
        usersCollection.countDocuments({
          lastSeenAt: { $gte: onlineSince },
        }),
        usersCollection.estimatedDocumentCount(),
        postsCollection.estimatedDocumentCount(),
        postsCollection
          .aggregate([
            {
              $match: {
                country: { $type: "string", $ne: "" },
              },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            {
              $group: {
                _id: "$country",
                postsCount: { $sum: 1 },
                cities: { $addToSet: "$city" },
              },
            },
            { $limit: 500 },
          ])
          .toArray(),
      ]);

    const countries = mergeCountryRows(countryRows);

    return Response.json(
      {
        success: true,
        stats: {
          activeMembers,
          accountsCreated,
          postsPublished,
          countriesCount: countries.length,
        },
        popularCountries: countries.slice(0, 6),
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/discovery/overview error:", error);

    return Response.json(
      {
        success: false,
        message: "Statisticile comunității nu au putut fi încărcate.",
      },
      { status: 500 }
    );
  }
}
