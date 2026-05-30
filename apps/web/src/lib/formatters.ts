export function safeFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^a-z0-9-_]/g, "") || "agent"
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function formatUptime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 1) {
    return `${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 1) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function humanizeEnum(value: string): string {
  return value.replaceAll("_", " ");
}
