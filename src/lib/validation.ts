import { z } from 'zod';

export const IngestPayloadSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(10, { message: "The 'rawText' field is required and must be at least 10 characters." })
    .max(5000, { message: "Security Block: Input length exceeds safe limits (maximum 5000 characters)." }),
});

export type IngestPayload = z.infer<typeof IngestPayloadSchema>;