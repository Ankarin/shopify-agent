import { db } from "@/db";
import { organizations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;

        const organization = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

        if (!organization[0]) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(organization[0]);
    } catch (error) {
        console.error("Error fetching organization:", error);
        return NextResponse.json(
            { error: "Failed to fetch organization" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;
        const body = await req.json();
        const { name, website, data } = body;

        if (!name || !website) {
            return NextResponse.json(
                { error: "Name and website are required" },
                { status: 400 }
            );
        }

        const updatedOrganization = await db
            .update(organizations)
            .set({
                name,
                website,
                data: data || null,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId))
            .returning();

        if (!updatedOrganization[0]) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedOrganization[0]);
    } catch (error) {
        console.error("Error updating organization:", error);
        return NextResponse.json(
            { error: "Failed to update organization" },
            { status: 500 }
        );
    }
}

