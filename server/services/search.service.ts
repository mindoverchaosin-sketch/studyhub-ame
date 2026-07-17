import prisma from "@/lib/prisma";
import type { SearchCategory, SearchResponse, SearchResultItem } from "@/features/search/types";

function normalize(value?: string | null) {
  return value?.toLowerCase() ?? "";
}

function createResult(
  category: SearchCategory,
  id: string,
  title: string,
  description: string | null | undefined,
  href: string,
  meta: string,
): SearchResultItem {
  return {
    id,
    category,
    title,
    description: description ?? undefined,
    href,
    meta,
  };
}

export async function searchContent(query: string): Promise<SearchResponse> {
  const normalized = query.trim().toLowerCase();
  const suggestions = ["Aircraft", "Electrical", "PDF", "Quiz", "Systems", "Maintenance"];

  if (!normalized) {
    return {
      query: "",
      groupedResults: {
        course: [],
        module: [],
        section: [],
        topic: [],
        resource: [],
        question: [],
      },
      totalResults: 0,
      suggestions,
    };
  }

  const [courses, modules, sections, topics, resources, questions] = await Promise.all([
    prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [{ title: { contains: normalized, mode: "insensitive" } }, { description: { contains: normalized, mode: "insensitive" } }],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.module.findMany({
      where: {
        isPublished: true,
        OR: [{ title: { contains: normalized, mode: "insensitive" } }, { description: { contains: normalized, mode: "insensitive" } }],
      },
      include: {
        course: true,
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.section.findMany({
      where: {
        isPublished: true,
        OR: [{ title: { contains: normalized, mode: "insensitive" } }, { description: { contains: normalized, mode: "insensitive" } }],
      },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.topic.findMany({
      where: {
        isPublished: true,
        OR: [{ title: { contains: normalized, mode: "insensitive" } }, { description: { contains: normalized, mode: "insensitive" } }],
      },
      include: {
        section: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.resource.findMany({
      where: {
        OR: [{ title: { contains: normalized, mode: "insensitive" } }, { description: { contains: normalized, mode: "insensitive" } }, { url: { contains: normalized, mode: "insensitive" } }],
        topic: {
          isPublished: true,
          section: {
            isPublished: true,
            module: {
              isPublished: true,
              course: {
                isPublished: true,
              },
            },
          },
        },
      },
      include: {
        topic: {
          include: {
            section: {
              include: {
                module: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.question.findMany({
      where: {
        OR: [{ question: { contains: normalized, mode: "insensitive" } }, { explanation: { contains: normalized, mode: "insensitive" } }],
        topic: {
          isPublished: true,
          section: {
            isPublished: true,
            module: {
              isPublished: true,
              course: {
                isPublished: true,
              },
            },
          },
        },
      },
      include: {
        topic: {
          include: {
            section: {
              include: {
                module: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const groupedResults = {
    course: courses.map((course) =>
      createResult("course", course.id, course.title, course.description, `/student/courses/${course.slug}`, course.examType),
    ),
    module: modules.map((module) =>
      createResult(
        "module",
        module.id,
        module.title,
        module.description,
        `/student/courses/${module.course.slug}/modules/${module.slug}`,
        module.course.title,
      ),
    ),
    section: sections.map((section) =>
      createResult(
        "section",
        section.id,
        section.title,
        section.description,
        `/student/courses/${section.module.course.slug}/modules/${section.module.slug}`,
        section.module.title,
      ),
    ),
    topic: topics.map((topic) =>
      createResult(
        "topic",
        topic.id,
        topic.title,
        topic.description,
        `/student/topics/${topic.slug}`,
        topic.section.module.title,
      ),
    ),
    resource: resources.map((resource) => {
      const href = resource.url.startsWith("http") || resource.url.startsWith("/") ? resource.url : `/student/topics/${resource.topic.slug}`;
      return createResult("resource", resource.id, resource.title, resource.description, href, resource.type);
    }),
    question: questions.map((question) =>
      createResult("question", question.id, question.question, question.explanation, `/student/topics/${question.topic.slug}`, question.topic.title),
    ),
  } satisfies Record<SearchCategory, SearchResultItem[]>;

  const totalResults = Object.values(groupedResults).reduce((sum, group) => sum + group.length, 0);

  return {
    query: normalized,
    groupedResults,
    totalResults,
    suggestions,
  };
}
