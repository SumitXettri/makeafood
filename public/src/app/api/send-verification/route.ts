import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

// Make sure this is server-side only

export async function POST(req: Request) {
  const { userId, email, username } = await req.json();

  if (!userId || !email || !username) {
    return NextResponse.json(
      { error: "Missing userId, email, or username" },
      { status: 400 }
    );
  }

  // Check environment variables
  const EMAIL_USER = process.env.GMAIL_USER;
  const EMAIL_PASS = process.env.GMAIL_PASS;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("EMAIL_USER or EMAIL_PASS not defined!");
    return NextResponse.json(
      { error: "Server email not configured" },
      { status: 500 }
    );
  }

  try {
    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS, // App password, no spaces
      },
    });

    // Create a simple verification link (you can improve this)
    const verifyLink = `${
      process.env.NEXT_PUBLIC_BASE_URL
    }/verify?userId=${userId}&username=${encodeURIComponent(
      username
    )}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: `"MakeAFood" <${EMAIL_USER}>`,
      to: email,
      subject: "Welcome to MakeAFood! Please verify your email",
      html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 12px 12px 0 0;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: rgba(255, 255, 255, 0.95); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                      <span style="font-size: 40px;">🍽️</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">MakeAFood</h1>
                    <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">Welcome ${username}! 🎉</p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                      Verify Your Email Address
                    </h2>
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Thanks for signing up for MakeAFood! We're excited to have you on board. To get started with discovering and creating amazing recipes, please verify your email address.
                    </p>
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Click the button below to confirm your account:
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" style="margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${verifyLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); transition: transform 0.2s;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <div style="padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #ff6b6b; word-break: break-all;">
                      <a href="${verifyLink}" style="color: #ff6b6b; text-decoration: none; font-size: 14px;">
                        ${verifyLink}
                      </a>
                    </div>
                    
                    <!-- Features Section -->
                    <div style="margin-top: 40px; padding: 24px; background: linear-gradient(135deg, #f0f9ff 0%, #fef3c7 100%); border-radius: 8px;">
                      <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: 600;">
                        What you can do with MakeAFood:
                      </p>
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #ff6b6b; font-size: 18px; margin-right: 10px;">✨</span>
                            <span style="color: #374151; font-size: 14px;">Discover thousands of delicious recipes</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #ff6b6b; font-size: 18px; margin-right: 10px;">👨‍🍳</span>
                            <span style="color: #374151; font-size: 14px;">Create and share your own recipes</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #ff6b6b; font-size: 18px; margin-right: 10px;">💾</span>
                            <span style="color: #374151; font-size: 14px;">Save your favorite dishes</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #ff6b6b; font-size: 18px; margin-right: 10px;">🌟</span>
                            <span style="color: #374151; font-size: 14px;">Get personalized recommendations</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        <strong>📧 Didn't sign up?</strong> If you didn't create an account with MakeAFood, you can safely ignore this email. No further action is required.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                      Need help? Contact us at <a href="mailto:support@makeafood.com" style="color: #ff6b6b; text-decoration: none;">support@makeafood.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} MakeAFood. All rights reserved.
                    </p>
                    <div style="text-align: center; margin-top: 16px;">
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                      <span style="color: #d1d5db;">•</span>
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Terms of Service</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Verification email sent to ${email}`);
    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
