// zrafehgnneqeazhr
// 📂 Location: src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client"; // 🌟 ADDED: Prisma import here
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { encryptPassword } from "../../../../lib/crypto"; 

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, appPassword, accountPassword } = await req.json();

    // 1. Parameter Presence Check
    if (!name || !email || !appPassword || !accountPassword) {
      return NextResponse.json(
        { success: false, message: "Missing required registration fields." },
        { status: 400 }
      );
    }

    // 2. Email Structural Format Validation
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address format." },
        { status: 400 }
      );
    }

    // 3. Password Strength Validation Threshold
    if (accountPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Account password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 4. Check for existing account records
    const userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (userExists) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 5. Cryptographic Hashing of Platform Password
    const hashedAccountPassword = await bcrypt.hash(accountPassword, 12);

    // Use your shared encryption handler to prepare the password string safely
    const secureEncryptedPass = encryptPassword(appPassword.trim());

    // 6. Database Transaction Layer Execution
    // 🌟 FIX: Explicitly type 'tx' as Prisma.TransactionClient to pass strict type-checks
    const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedAccountPassword,
        },
      });

      await tx.inboxSetting.create({
        data: {
          userId: user.id,
          emailAddress: email.toLowerCase().trim(),
          encryptedPass: secureEncryptedPass, 
          imapHost: "imap.gmail.com",        
        },
      });

      return user;
    });

    // 7. Isolated Background Email Dispatch
    if (process.env.RESEND_API_KEY) {
      resend.emails.send({
        from: "LogiShield AI <onboarding@resend.dev>",
        to: newUser.email,
        subject: "Welcome to LogiShield AI",
        html: `<p>Hello ${name}, your background dashboard mail stream configuration is now fully initialized!</p>`,
      }).catch((err) => console.error("Quiet Email Dispatch Error:", err));
    }

    return NextResponse.json(
      { success: true, message: "Account registered successfully.", userId: newUser.id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ [REGISTRATION ENGINE FAULT]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}