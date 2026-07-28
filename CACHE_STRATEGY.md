# Cache Strategy

## Cached services

The following read-heavy services now use a lightweight in-memory cache:
- Dashboard summary: cached for 60 seconds
- Study planner: cached for 90 seconds
- Progress insights: cached for 90 seconds
- Achievement summary: cached for 90 seconds
- Continue learning: cached for 60 seconds
- Goal progress: cached for 90 seconds

The cache sits above the service layer and wraps service outputs. Repositories remain unaware of caching.

## Cache lifetime

- Dashboard summary, continue learning: 60 seconds
- Study planner, progress insights, achievement summary, goal progress: 90 seconds
- Cache entries are evicted automatically when they expire.

## Invalidation triggers

The following mutations invalidate affected cache entries:
- Exam completion / submission: invalidates dashboard, study planner, progress insights, achievements, continue learning, and goal progress caches.
- Goal update: invalidates the goal progress cache.
- Progress update: invalidates dashboard, study planner, progress insights, achievements, continue learning, and goal progress caches.
- Achievement unlock: invalidates the achievement summary cache.
- Module completion: invalidates dashboard, study planner, progress insights, achievements, continue learning, and goal progress caches.

## Future Redis migration notes

The current implementation uses in-memory caching only and is intentionally framework-local. If the application grows, the same cache interface can be replaced with a Redis-backed implementation without changing service call sites.
