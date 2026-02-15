#!/usr/bin/env node

/**
 * Cara pakai:
 * node import-horse.js data.json
 * node import-horse.js data.json --email user@mail.com --password 123456
 */

import "dotenv/config";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// ===============================
// Ambil argumen CLI
// ===============================
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("❌ Masukkan nama file JSON");
  console.log(
    "Contoh: node import-horse.js data.json --email user@mail.com --password 123456",
  );
  process.exit(1);
}

const fileName = args[0];

// Optional params
let email = null;
let password = null;

args.forEach((arg, i) => {
  if (arg === "--email") email = args[i + 1];
  if (arg === "--password") password = args[i + 1];
});

// ===============================
// Konfigurasi Supabase
// ===============================
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL / SUPABASE_ANON_KEY belum diset di .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ===============================
// Nama tabel
// ===============================
const TABLE_NAME = "horses"; // ganti sesuai tabel

// ===============================
// Helper hapus HTML
// ===============================
function stripHtml(html) {
  if (!html) return null;
  return html.replace(/<[^>]*>?/gm, "");
}

// ===============================
// Login optional
// ===============================
async function loginIfNeeded() {
  if (!email || !password) {
    console.log("ℹ️ Login dilewati (pakai API key)");
    return;
  }

  console.log("🔐 Login...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("❌ Login gagal:", error.message);
    process.exit(1);
  }

  console.log("✅ Login berhasil:", data.user.email);
}

// ===============================
// Import data
// ===============================
async function importData() {
  try {
    if (!fs.existsSync(fileName)) {
      console.error("❌ File tidak ditemukan:", fileName);
      process.exit(1);
    }

    const raw = fs.readFileSync(fileName, "utf-8");
    const json = JSON.parse(raw);

    if (!Array.isArray(json)) {
      console.error("❌ Format JSON harus array []");
      process.exit(1);
    }

    console.log(`📦 Total data: ${json.length}`);

    const formatted = json.map((item) => {
      var id = item.id;
      if (item.id == "" || item.id == null) {
        id = crypto.randomUUID();
      }
      return {
        id: id,
        name: stripHtml(item.name),
        status: item.status,
        brk_number: item.brk_number,
        created_at: item.created_at,
        updated_at: item.updated_at,
        owner: item.owner,
        father_id: item.father_id,
        mother_id: item.mother_id,
        height: item.height,
        trainer: item.trainer,
        discipline: item.discipline,
        color_name: item.color_name,
        gender_name: item.gender_name,
        birth_year: item.birth_year,
        generation_name: item.generation_name,
        contact: item.contact,
        father_name: item.father_name,
        mother_name: item.mother_name,
        breed_name: item.breed_name,
      };
    });

    const chunkSize = 500;

    for (let i = 0; i < formatted.length; i += chunkSize) {
      const chunk = formatted.slice(i, i + chunkSize);

      const { error } = await supabase.from(TABLE_NAME).insert(chunk);

      if (error) {
        console.error("❌ Error batch:", error.message);
      } else {
        console.log(`✅ Inserted ${i + chunk.length} / ${formatted.length}`);
      }
    }

    console.log("🎉 Import selesai");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// ===============================
// Run
// ===============================
await loginIfNeeded();
await importData();
