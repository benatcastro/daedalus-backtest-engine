// lib/getStrategies.ts
import { prisma } from "@/lib/prisma";
export async function getStrategiesForUser(username: string) {
    // Access database or other services here
    return [
        { id: 1, name: "Strategy 1" },
        { id: 2, name: "Strategy 2" },
    ];
}
