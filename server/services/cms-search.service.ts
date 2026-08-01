export type CmsSearchItem = {
  id: string;
  type: 'lesson' | 'module' | 'question' | 'mock-test' | 'media';
  title: string;
  subtitle?: string;
  status?: string;
};

export class CmsSearchService {
  search(items: CmsSearchItem[], query: string, type?: string, status?: string, sortBy?: 'title' | 'updatedAt') {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesQuery = !normalizedQuery || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(normalizedQuery);
      const matchesType = !type || type === 'all' || item.type === type;
      const matchesStatus = !status || status === 'all' || item.status === status;
      return matchesQuery && matchesType && matchesStatus;
    });

    return filtered.sort((left, right) => left.title.localeCompare(right.title));
  }
}

export const cmsSearchService = new CmsSearchService();
