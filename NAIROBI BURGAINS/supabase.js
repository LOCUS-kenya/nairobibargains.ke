const SUPABASE_URL = "https://finafitpizngsoqlpcud.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_gBFOHf0Qym7Be0GYh1H9tA_LpcHuk7s";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;

console.log("Supabase initialized successfully.");