import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().default('3000').transform(Number),

    // Database
    DB_PASSWORD: z.string().min(1),
    DB_USERNAME: z.string().min(1),
    DATABASE: z.string().min(1),
    DATABASE_LOCAL: z.string().min(1),

    // JWT
    JWT_SECRET: z.string().min(32, "Secret should be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/),
    JWT_COOKIE_EXPERIES_IN: z.string().transform(Number),

    // Mailtrap
    EMAIL_USERNAME_MAILTRAP: z.string().min(1),
    EMAIL_PASSWORD_MAILTRAP: z.string().min(1),
    EMAIL_HOST_MAILTRAP: z.string().min(1),
    EMAIL_PORT_MAILTRAP: z.string().transform(Number),

    // SendGrid & General Email
    EMAIL_FROM: z.string().email(),
    EMAIL_PASSWORD_SENDGRID: z.string().min(1),
    EMAIL_USERNAME_SENDGRID: z.string().min(1),

    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_PUBLIC_KEY: z.string().min(1),

    // Redis
    REDIS_USERNAME: z.string().min(1),
    REDIS_PORT: z.string().transform(Number),
    REDIS_HOST: z.string().min(1),
    REDIS_PASSWORD: z.string().min(1),
});

// Validate process.env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(" Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}



/* eslint-disable @typescript-eslint/no-namespace */
declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> { }
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

export { };

