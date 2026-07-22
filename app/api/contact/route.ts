import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phoneNumber,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("WhatsApp API Error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Save booking to database
    const { data: booking, error: dbError } = await supabase
      .from("bookings")
      .insert([
        {
          client_name: name,
          client_email: email,
          client_phone: phone,
          project_type: "General Inquiry",
          project_description: message,
          status: "pending",
      },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database Error:", dbError);
      return NextResponse.json(
        { error: "Failed to save booking" },
        { status: 500 }
      );
    }

    // Send email notification to admin
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Booking Request from ${name}`,
        html: `
          <h2>New Booking Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${booking.id}">View in Admin Dashboard</a></p>
        `,
      });
      
      // Update email_sent status
      await supabase
        .from("bookings")
        .update({ email_sent: true })
        .eq("id", booking.id);
    } catch (emailError) {
      console.error("Email Error:", emailError);
    }

    // Send WhatsApp message if phone number provided
    if (phone && process.env.WHATSAPP_API_TOKEN) {
      const whatsappMessage = `Hello ${name},\n\nThank you for reaching out to Opal Design! We received your inquiry and will get back to you soon.\n\nBest regards,\nOpal Team`;
      
      const whatsappSent = await sendWhatsAppMessage(phone, whatsappMessage);
      
      if (whatsappSent) {
        await supabase
          .from("bookings")
          .update({ whatsapp_sent: true })
          .eq("id", booking.id);
      }
    }

    // Send confirmation email to client
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "We received your inquiry - Opal Design",
        html: `
          <h2>Thank you for your inquiry!</h2>
          <p>Hi ${name},</p>
          <p>We received your message and will review it shortly. Our team will get back to you within 24-48 hours.</p>
          <hr>
          <p>Best regards,<br>Opal Design Team</p>
        `,
      });
    } catch (confirmEmailError) {
      console.error("Confirmation Email Error:", confirmEmailError);
    }

    return NextResponse.json(
      { success: true, bookingId: booking.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
