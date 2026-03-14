
  # Expense Monitoring App

  This is a code bundle for Expense Monitoring App. The original project is available at https://www.figma.com/design/Tm1zL39spyIPJuObtLvl40/Expense-Monitoring-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Supabase setup

  1. Copy `.env.example` to `.env`.
  2. Replace values with your Supabase project URL and anon key.
  3. Restart the Vite dev server after changing `.env` values.

  SQL table used for simulated SMS storage:

  ```sql
  create table if not exists public.simulated_sms (
    id bigint generated always as identity primary key,
    user_id text not null,
    raw_text text not null,
    amount numeric,
    merchant text,
    app_name text,
    avg_spend numeric,
    received_at timestamptz not null default now()
  );
  ```
  