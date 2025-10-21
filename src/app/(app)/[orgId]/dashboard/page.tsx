"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, MessageSquare, DollarSign, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Analytics {
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    metrics: {
        totalChats: number;
        totalMessages: number;
        totalConversions: number;
        conversationResolvedPercentage: number;
        revenue: Record<string, number>;
        escalated: number;
        resolved: number;
        afterHours: number;
        inProgress: number;
    };
    topQuestions: Array<{
        topic: string;
        question: string;
        count: number;
    }>;
}

export default function DashboardPage() {
    const params = useParams();
    const orgId = params?.orgId as string;
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(30);

    useEffect(() => {
        if (!orgId) return;

        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/organizations/${orgId}/analytics?days=${period}`);
                if (response.ok) {
                    const data = await response.json();
                    setAnalytics(data);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [orgId, period]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">No Data Available</h1>
                </div>
            </div>
        );
    }

    const totalRevenue = Object.values(analytics.metrics.revenue).reduce((a, b) => a + b, 0);
    const mainCurrency = Object.keys(analytics.metrics.revenue)[0] || 'USD';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <Tabs value={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
                    <TabsList>
                        <TabsTrigger value="7">7 Days</TabsTrigger>
                        <TabsTrigger value="30">30 Days</TabsTrigger>
                        <TabsTrigger value="90">90 Days</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.metrics.totalChats}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.metrics.afterHours} after-hours (outside 9AM-5PM)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mainCurrency} ${totalRevenue.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.metrics.totalConversions} conversions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversation Resolved</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.metrics.conversationResolvedPercentage}%</div>
                        <p className="text-xs text-muted-foreground">
                            of conversations resolved by AI
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversation Status</CardTitle>
                        <CardDescription>Breakdown of conversation states</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="font-medium">Resolved</span>
                            </div>
                            <span className="text-2xl font-bold">{analytics.metrics.resolved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <span className="font-medium">Escalated</span>
                            </div>
                            <span className="text-2xl font-bold">{analytics.metrics.escalated}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <span className="font-medium">In Progress</span>
                            </div>
                            <span className="text-2xl font-bold">{analytics.metrics.inProgress}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Questions & Responses</CardTitle>
                        <CardDescription>Most frequently asked questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.topQuestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No questions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {analytics.topQuestions.slice(0, 5).map((q, idx) => (
                                    <div key={idx} className="flex items-start justify-between pb-3 border-b last:border-0">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                                    {q.topic?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{q.question}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">{q.count}x</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

