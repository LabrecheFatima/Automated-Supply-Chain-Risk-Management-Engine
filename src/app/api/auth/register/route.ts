// 📂 Location: src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const prisma = new PrismaClient();

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Clean RFC 5322 Compliant Email Validation Regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 1. Parameter Presence Check
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required registration fields." },
        { status: 400 }
      );
    }

    // 2. Email Structural Format Validation
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address format." },
        { status: 400 }
      );
    }

    // 3. Password Strength Validation Threshold
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 4. Check for existing account records
    const userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (userExists) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 5. Cryptographic Hashing of Credentials
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Database Persistence Layer Execution
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    // 7. Background Salutation Greeting Email (Fire-and-forget style)
    try {
      await resend.emails.send({
        from: "LogiShield AI <onboarding@resend.dev>", // Replace with your verified custom domain later
        to: newUser.email,
        subject: "Welcome to LogiShield AI",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; background-color: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 16px;">
            <h2 style="color: #2563eb; margin-bottom: 16px; font-size: 24px; font-weight: 700;">Hello ${name},</h2>
            <p style="font-size: 16px; line-height: 24px; color: #334155;">Welcome to LogiShield AI! Your profile inside our logistics orchestration tracking network has been activated successfully.</p>
            <p style="font-size: 16px; line-height: 24px; color: #334155; margin-bottom: 24px;">Your immediate access is fully open. You do not need to click any activation links—your workspace and live dashboard tracking pipelines are waiting for you right now.</p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 32px;">
              <p style="font-size: 12px; color: #64748b; margin: 0; font-family: monospace;">LOGISHIELD SECURITY PROTOCOL // AUTOMATED SALUTATION METRIC</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      // Caught inside a secondary try-catch block so that if Resend hits a network issue or missing API key, 
      // the registration still succeeds and the user isn't locked out of their app.
      console.error("Background salutation dispatch failed:", emailError);
    }

    return NextResponse.json(
      { message: "Account registered successfully.", userId: newUser.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration Pipeline Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred while executing registration." },
      { status: 500 }
    );
  }
}