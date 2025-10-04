import { db } from "@/db";
import { organizations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allOrganizations = await db
            .select()
            .from(organizations)
            .orderBy(desc(organizations.createdAt));

        return NextResponse.json(allOrganizations);
    } catch (error) {
        console.error("Error fetching organizations:", error);
        return NextResponse.json(
            { error: "Failed to fetch organizations" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, website, data, shopifyDomain, shopifyAccessToken } = body;

        if (!name || !website) {
            return NextResponse.json(
                { error: "Name and website are required" },
                { status: 400 }
            );
        }

        const newOrganization = await db
            .insert(organizations)
            .values({
                name,
                website,
                data: data || null,
                shopifyDomain: shopifyDomain || null,
                shopifyAccessToken: shopifyAccessToken || null,
            })
            .returning();

        return NextResponse.json(newOrganization[0]);
    } catch (error) {
        console.error("Error creating organization:", error);
        return NextResponse.json(
            { error: "Failed to create organization" },
            { status: 500 }
        );
    }
}

