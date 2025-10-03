export default async function OrganizationPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;

    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Organization Dashboard</h1>
                <p className="text-muted-foreground">Organization ID: {orgId}</p>
            </div>
        </div>
    );
}

