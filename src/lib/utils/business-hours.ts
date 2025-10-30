export function isAfterHours(
    date: Date,
    timezone: string = 'Europe/London',
    businessHoursStart: number = 9,
    businessHoursEnd: number = 17
): boolean {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
        weekday: 'short'
    });

    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const isOutsideBusinessHours = hour < businessHoursStart || hour >= businessHoursEnd;

    return isWeekend || isOutsideBusinessHours;
}

export function formatTimezone(timezone: string): string {
    try {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        return timeString;
    } catch {
        return timezone;
    }
}

export const COMMON_TIMEZONES = [
    { value: 'Europe/London', label: 'UK (London)' },
    { value: 'America/New_York', label: 'US Eastern' },
    { value: 'America/Chicago', label: 'US Central' },
    { value: 'America/Denver', label: 'US Mountain' },
    { value: 'America/Los_Angeles', label: 'US Pacific' },
    { value: 'Europe/Paris', label: 'Central European' },
    { value: 'Europe/Berlin', label: 'Germany' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'China' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'New Zealand' },
];

