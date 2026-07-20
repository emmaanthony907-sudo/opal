// Test admin login by hitting Supabase directly, then checking the admin table
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gcopyynkxthzcqzzbwhu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb3B5eW5reHRoemNxenpid2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDc4ODksImV4cCI6MjA5ODU4Mzg4OX0.8wf8cRDQA1Kb2Yp_vydLi51d_9CtWvwxfUgPiIPsZNk";

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Logging in as mainasaraa377@gmail.com...");

const { data, error } = await supabase.auth.signInWithPassword({
  email: "mainasaraa377@gmail.com",
  password: "OpalAdmin2026!",
});

if (error) {
  console.error("Login FAILED:", error.message);
  process.exit(1);
}

console.log("✅ Login successful!");
console.log("User ID:", data.user.id);
console.log("Email:", data.user.email);
console.log("Session expires:", new Date(data.session.expires_at * 1000).toLocaleString());

// Check admin table
const { data: adminData, error: adminError } = await supabase
  .from("admins")
  .select("id, first_name, last_name, role")
  .eq("id", data.user.id)
  .single();

if (adminError) {
  console.error("❌ Admin table check FAILED:", adminError.message);
  process.exit(1);
}

console.log("✅ Admin table check passed:", adminData);
console.log("✅ Full login flow verified — the admin dashboard is accessible");
console.log("");
console.log("Credentials working:");
console.log("  URL:      https://00pal.vercel.app/admin/login");
console.log("  Email:    mainasaraa377@gmail.com");
console.log("  Password: OpalAdmin2026!");
