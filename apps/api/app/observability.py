from threading import Lock
from time import time
from typing import Any


class MetricsRegistry:
    def __init__(self):
        self._lock = Lock()
        self.started_at = time()
        self.total_requests = 0
        self.total_errors = 0
        self.total_latency_ms = 0.0
        self.by_route: dict[str, dict[str, Any]] = {}

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
    ) -> None:
        route_key = f"{method.upper()} {path}"

        with self._lock:
            self.total_requests += 1
            self.total_latency_ms += duration_ms

            if status_code >= 400:
                self.total_errors += 1

            if route_key not in self.by_route:
                self.by_route[route_key] = {
                    "requests": 0,
                    "errors": 0,
                    "total_latency_ms": 0.0,
                    "average_latency_ms": 0.0,
                    "last_status_code": None,
                }

            route_metrics = self.by_route[route_key]
            route_metrics["requests"] += 1
            route_metrics["total_latency_ms"] += duration_ms
            route_metrics["average_latency_ms"] = round(
                route_metrics["total_latency_ms"] / route_metrics["requests"],
                2,
            )
            route_metrics["last_status_code"] = status_code

            if status_code >= 400:
                route_metrics["errors"] += 1

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            average_latency_ms = 0.0

            if self.total_requests > 0:
                average_latency_ms = self.total_latency_ms / self.total_requests

            uptime_seconds = max(0, int(time() - self.started_at))

            return {
                "uptime_seconds": uptime_seconds,
                "total_requests": self.total_requests,
                "total_errors": self.total_errors,
                "average_latency_ms": round(average_latency_ms, 2),
                "routes": self.by_route,
            }


metrics_registry = MetricsRegistry()
