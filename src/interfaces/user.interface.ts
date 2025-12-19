export type UserRole = "user" | "guide" | "lead-guide" | "admin";

export interface IUser {
    email: string,
    role: UserRole,
    password: string,
    passwordConfirm: string | undefined,
    name: string,
    active: boolean,
    photo?: string,
    passwordResetExpires?: Date | undefined,
    passwordResetToken?: string | undefined,
    passwordChangedAt?: Date | undefined
}