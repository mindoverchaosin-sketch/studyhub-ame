import type { Question } from '@/types/ai';

export interface QuestionBankRepository {
  listQuestions(): Promise<Question[]>;
  getQuestion(questionId: string): Promise<Question | null>;
  bookmarkQuestion(questionId: string): Promise<Question | null>;
  getSimilarQuestions(topic: string): Promise<Question[]>;
}

export class PlaceholderQuestionBankRepository implements QuestionBankRepository {
  private readonly questions: Question[] = [
    {
      id: 'q-corro-1',
      question: 'Which material is most resistant to corrosion in a humid environment?',
      difficulty: 'Hard',
      module: 'DGCA Module 5',
      topic: 'Corrosion',
      standard: 'DGCA',
      status: 'Unanswered',
      isBookmarked: false,
      recommended: true,
    },
    {
      id: 'q-mats-2',
      question: 'What is the primary function of aircraft materials in load-bearing structures?',
      difficulty: 'Medium',
      module: 'EASA Module 6',
      topic: 'Aircraft Materials',
      standard: 'EASA',
      status: 'Answered',
      isBookmarked: true,
      recommended: false,
    },
  ];

  async listQuestions(): Promise<Question[]> {
    return this.questions.map((question) => ({ ...question }));
  }

  async getQuestion(questionId: string): Promise<Question | null> {
    return this.questions.find((question) => question.id === questionId) ?? null;
  }

  async bookmarkQuestion(questionId: string): Promise<Question | null> {
    const question = this.questions.find((entry) => entry.id === questionId);
    if (!question) {
      return null;
    }

    question.isBookmarked = !question.isBookmarked;
    return { ...question };
  }

  async getSimilarQuestions(topic: string): Promise<Question[]> {
    return this.questions.filter((question) => question.topic.toLowerCase().includes(topic.toLowerCase())).map((question) => ({ ...question }));
  }
}

export const placeholderQuestionBankRepository = new PlaceholderQuestionBankRepository();
