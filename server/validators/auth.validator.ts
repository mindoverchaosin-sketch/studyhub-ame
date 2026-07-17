import { z } from 'zod'

export const authLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const authRegisterSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).optional(),
})

export type AuthLoginInput = z.infer<typeof authLoginSchema>
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>
