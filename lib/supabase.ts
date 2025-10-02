import { createClient } from "@supabase/supabase-js";

// 🔹 Cliente público → usa no frontend e em chamadas normais
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🔹 Cliente admin → usa em jobs automáticos (assinaturas, relatórios, etc.)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
