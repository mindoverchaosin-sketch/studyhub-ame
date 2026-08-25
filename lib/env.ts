import { z } from 'zod'

const nodeEnvSchema = z.enum(['development', 'production', 'test']).default('development')
const aiProviderSchema = z.enum(['mock', 'openai', 'anthropic', 'gemini', 'google-gemini']).default('mock')

const rawEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.optional(),
  DATABASE_URL: z.string().trim().min(1).optional(),
  NEXTAUTH_URL: z.string().trim().url().optional(),
  NEXTAUTH_SECRET: z.string().trim().min(32).optional(),
  AUTH_SECRET: z.string().trim().min(32).optional(),
  AI_PROVIDER: aiProviderSchema.optional(),
  PAYMENT_PROVIDER: z.enum(['mock', 'razorpay', 'stripe']).optional(),
  RAZORPAY_KEY_ID: z.string().trim().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().trim().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  BILLING_CRON_SECRET: z.string().trim().min(32).optional(),
  ERROR_REPORT_WEBHOOK_URL: z.string().trim().url().optional(),
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  OPENAI_MODEL: z.string().trim().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  ANTHROPIC_MODEL: z.string().trim().min(1).optional(),
  GOOGLE_GEMINI_API_KEY: z.string().trim().min(1).optional(),
  GOOGLE_GEMINI_MODEL: z.string().trim().min(1).optional(),
  GOOGLE_API_KEY: z.string().trim().min(1).optional(),
  GOOGLE_CLOUD_API_KEY: z.string().trim().min(1).optional(),
  MAX_MEDIA_UPLOAD_SIZE_BYTES: z
    .preprocess((value) => {
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : value
      }
      return value
    }, z.number().int().positive())
    .optional(),
  PORT: z
    .preprocess((value) => {
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : value
      }
      return value
    }, z.number().int().positive())
    .optional(),
  ADMIN_PASSWORD: z.string().trim().min(8).optional(),
  SUPER_ADMIN_EMAIL: z.string().trim().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().trim().min(8).optional(),
  VITEST: z.enum(['true', 'false']).optional(),
})

const parsed = rawEnvSchema.parse(process.env)

const env = {
  NODE_ENV: parsed.NODE_ENV ?? 'development',
  DATABASE_URL: parsed.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  NEXTAUTH_URL: parsed.NEXTAUTH_URL ?? 'http://localhost:3000',
  NEXTAUTH_SECRET: parsed.NEXTAUTH_SECRET ?? parsed.AUTH_SECRET,
  AI_PROVIDER: parsed.AI_PROVIDER ?? 'mock',
  PAYMENT_PROVIDER: parsed.PAYMENT_PROVIDER ?? 'mock',
  RAZORPAY_KEY_ID: parsed.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: parsed.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: parsed.RAZORPAY_WEBHOOK_SECRET,
  BILLING_CRON_SECRET: parsed.BILLING_CRON_SECRET,
  ERROR_REPORT_WEBHOOK_URL: parsed.ERROR_REPORT_WEBHOOK_URL,
  OPENAI_API_KEY: parsed.OPENAI_API_KEY,
  OPENAI_MODEL: parsed.OPENAI_MODEL ?? 'gpt-4.1-mini',
  ANTHROPIC_API_KEY: parsed.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: parsed.ANTHROPIC_MODEL ?? 'claude-3.5',
  GOOGLE_GEMINI_API_KEY: parsed.GOOGLE_GEMINI_API_KEY,
  GOOGLE_GEMINI_MODEL: parsed.GOOGLE_GEMINI_MODEL ?? 'gemini-1.5',
  GOOGLE_API_KEY: parsed.GOOGLE_API_KEY,
  GOOGLE_CLOUD_API_KEY: parsed.GOOGLE_CLOUD_API_KEY,
  MAX_MEDIA_UPLOAD_SIZE_BYTES: parsed.MAX_MEDIA_UPLOAD_SIZE_BYTES ?? 10 * 1024 * 1024,
  PORT: parsed.PORT,
  ADMIN_PASSWORD: parsed.ADMIN_PASSWORD,
  SUPER_ADMIN_EMAIL: parsed.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: parsed.SUPER_ADMIN_PASSWORD,
  VITEST: parsed.VITEST,
}

// don't force a development secret here so production validation can fail fast
const validatedEnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema,
    DATABASE_URL: z.string().trim().min(1).optional(),
    NEXTAUTH_URL: z.string().trim().url().optional(),
    NEXTAUTH_SECRET: z.string().trim().min(32).optional(),
    AI_PROVIDER: aiProviderSchema,
    OPENAI_API_KEY: z.string().trim().min(1).optional(),
    OPENAI_MODEL: z.string().trim().min(1),
    ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
    ANTHROPIC_MODEL: z.string().trim().min(1),
    GOOGLE_GEMINI_API_KEY: z.string().trim().min(1).optional(),
    GOOGLE_GEMINI_MODEL: z.string().trim().min(1),
    GOOGLE_API_KEY: z.string().trim().min(1).optional(),
    GOOGLE_CLOUD_API_KEY: z.string().trim().min(1).optional(),
    PAYMENT_PROVIDER: z.enum(['mock', 'razorpay', 'stripe']),
    RAZORPAY_KEY_ID: z.string().trim().min(1).optional(),
    RAZORPAY_KEY_SECRET: z.string().trim().min(1).optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
    BILLING_CRON_SECRET: z.string().trim().min(32).optional(),
    ERROR_REPORT_WEBHOOK_URL: z.string().trim().url().optional(),
    AUTH_SECRET: z.string().trim().min(32).optional(),
    MAX_MEDIA_UPLOAD_SIZE_BYTES: z.number().int().positive(),
    PORT: z.number().int().positive().optional(),
    ADMIN_PASSWORD: z.string().trim().min(8).optional(),
    SUPER_ADMIN_EMAIL: z.string().trim().email().optional(),
    SUPER_ADMIN_PASSWORD: z.string().trim().min(8).optional(),
    VITEST: z.enum(['true', 'false']).optional(),
  })
  .superRefine((parsedEnv, ctx) => {
    if (parsedEnv.NODE_ENV === 'production') {
      if (!parsedEnv.DATABASE_URL) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DATABASE_URL is required in production.' })
      }
      if (!parsedEnv.NEXTAUTH_URL) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'NEXTAUTH_URL is required in production.' })
      }
      if (!parsedEnv.NEXTAUTH_SECRET && !parsedEnv.AUTH_SECRET) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'NEXTAUTH_SECRET or AUTH_SECRET is required in production.' })
      }
    }

    const provider = parsedEnv.AI_PROVIDER
    if (provider === 'openai' && !parsedEnv.OPENAI_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai.' })
    }
    if (provider === 'anthropic' && !parsedEnv.ANTHROPIC_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic.' })
    }
    if ((provider === 'gemini' || provider === 'google-gemini') && !parsedEnv.GOOGLE_GEMINI_API_KEY && !parsedEnv.GOOGLE_API_KEY && !parsedEnv.GOOGLE_CLOUD_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GOOGLE_GEMINI_API_KEY, GOOGLE_API_KEY or GOOGLE_CLOUD_API_KEY is required when AI_PROVIDER is gemini or google-gemini.',
      })
    }

    const paymentProvider = parsedEnv.PAYMENT_PROVIDER
    if (paymentProvider === 'razorpay') {
      if (!parsedEnv.RAZORPAY_KEY_ID) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'RAZORPAY_KEY_ID is required when PAYMENT_PROVIDER=razorpay.' })
      }
      if (!parsedEnv.RAZORPAY_KEY_SECRET) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'RAZORPAY_KEY_SECRET is required when PAYMENT_PROVIDER=razorpay.' })
      }
      if (!parsedEnv.RAZORPAY_WEBHOOK_SECRET) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'RAZORPAY_WEBHOOK_SECRET is required when PAYMENT_PROVIDER=razorpay.' })
      }
    }
  })

validatedEnvSchema.parse(env)

// Provide a safe default for local development only
const envWithDefaults = {
  ...env,
  NEXTAUTH_SECRET: env.NEXTAUTH_SECRET ?? 'development-secret',
}

export { envWithDefaults as env }
