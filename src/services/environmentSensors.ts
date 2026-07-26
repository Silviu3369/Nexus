export const getEnvironmentSensors = async () => {
    let batteryLevel = "Unknown";
    let batteryCharging = "Unknown";
    try {
        if ('getBattery' in navigator) {
            const battery = await (navigator as any).getBattery();
            batteryLevel = `${Math.round(battery.level * 100)}%`;
            batteryCharging = battery.charging ? "Yes" : "No";
        }
    } catch (e) {
        // ignore
    }

    let networkType = "Unknown";
    let downlink = "Unknown";
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
        networkType = conn.effectiveType || "Unknown";
        downlink = conn.downlink ? `${conn.downlink} Mbps` : "Unknown";
    }

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        deviceMemory: 'deviceMemory' in navigator ? `${(navigator as any).deviceMemory} GB+` : "Unknown",
        hardwareConcurrency: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : "Unknown",
        batteryLevel,
        batteryCharging,
        networkType,
        networkSpeed: downlink,
        themePreference: isDarkMode ? "Dark Mode" : "Light Mode",
        visibilityState: document.visibilityState,
        localTime: new Date().toString()
    };
};
