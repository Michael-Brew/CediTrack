# CediTrack 🇬🇭 - Personal & SME Finance Tracker (Ghana)

A modern, responsive, and Ghana-focused web application designed to help individuals and small businesses (SMEs) gain full visibility over their cashflow, manage Mobile Money (**MTN MoMo**, **Telecel Cash**, **AT Money**), bank accounts (**GCB**, **Ecobank**, **Stanbic**, **Absa**, **Fidelity**, **CalBank**), and cash/tills, with **smart Ghanaian keyword categorization**, **interactive statement import review**, and **30-day statistical anomaly detection** for high expenses.

---

## 🌟 Key Features

1. **🇬🇭 Ghana-Tailored Financial Accounts**:
   - Built-in presets for Ghanaian Mobile Money networks, commercial banks, shop cash tills, and Susu savings boxes.
   - Real-time running balance, inflow/outflow tracking, and inter-account transfers.

2. **🧠 Smart Ghanaian Keyword Categorization & Account Resolver**:
   - Recognizes local vocabulary across Income & Expense categories:
     - **Transport**: *Trotro, taxi, Uber, Bolt, Yango, Goil, Shell, Total, VIP bus, fare*
     - **Food**: *Chop bar, Waakye, Jollof, KFC, Pizzaman, Chickenman, Papaye, Kenkey, Buka, Melcom*
     - **Bills & Utilities**: *ECG prepaid power tokens, GWCL water bills, DStv, GOtv*
     - **MoMo, Airtime & Data**: *MTN, Telecel/Vodafone Cash, AT Money, MTN fiber, turbonet*
     - **Susu & Savings**: *Daily/weekly Susu contributions, savings boxes, mutual funds*
     - **SME Operations**: *Makola fabric wholesale, inventory restock, courier dispatch, Instagram ads*
     - **Income**: *Payroll salary, boutique/shop sales, TapTap Send/WorldRemit remittances, Susu payouts*
   - Live category suggestion in the manual entry form as the user types descriptions.

3. **📊 30-Day Rolling Window Anomaly & High Expense Detection**:
   - Evaluates expense transactions within a **30-day statistical rolling window** per category.
   - For categories with $\ge 5$ transactions in 30 days: flags expenses exceeding $\mu + 2\sigma$ (mean + 2 standard deviations).
   - For categories with $< 5$ transactions: flags expenses exceeding $3 \times$ the 30-day category average.
   - Generates plain-English Ghana Cedi explanations (e.g., *"This ₵1,850.00 expense is unusually high compared to your 30-day average of ₵42.50 (±₵18.20) for Food"*).
   - Interactive Unusual Spending alert panel with 1-click acknowledge/dismissal.

4. **📑 Intelligent Statement Import & Interactive Review Wizard**:
   - Supports `.csv`, `.xlsx`, and `.xls` files.
   - Auto-detects statement formats:
     - Format A: Single Amount + Type / Signed Amount
     - Format B: Separate Debit & Credit columns (Bank exports)
     - Format C: MTN MoMo statement exports
     - Format D: SME Daily Sales & Expense records
   - Interactive review grid allows editing Date, Narration, Amount, Type, Category, and Target Account prior to committing to the ledger.
   - Downloadable CSV templates for quick testing.

5. **📈 Visual Financial Analytics (Recharts)**:
   - **Running Balance by Account**: Interactive multi-line chart tracking cumulative account balances.
   - **Income vs Expense Over Time**: Monthly comparison bar chart with net savings overlay.
   - **Spending by Category**: Donut chart with percentages and category legend breakdown.
   - **Top 5 Spending Shifts**: Compares this month vs last month with percentage variance badges (`+15%`, `-8%`).

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Recharts, Lucide-React.
- **Backend**: Python 3.10+ / FastAPI, SQLAlchemy, Pydantic v2, Pandas, OpenPyXL, PyJWT / Python-Jose, Pytest.
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security RLS policies) + Seamless Local SQLite fallback for instant zero-config testing.

---

## 🚀 Quick Start & Running Locally

### 1. Backend Setup (FastAPI)

```bash
cd backend

# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI dev server (defaults to port 8000)
uvicorn app.main:app --reload --port 8000
```

FastAPI will start at `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`).

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# 1. Install npm dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Frontend will be available at `http://localhost:5173`.

---

## 🗄️ Supabase PostgreSQL Setup & RLS

When deploying to Supabase:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Go to the **SQL Editor** in Supabase and paste the contents of `supabase/schema.sql`.
3. The SQL migration creates:
   - `accounts`, `categories`, `transactions`, `upload_logs` tables.
   - Performance indexes on `(user_id, date)` and `(user_id, category, date)`.
   - Row Level Security (RLS) policies ensuring users can only read/write their own records (`auth.uid() = user_id`).
   - Default Ghanaian system categories seed data.
4. Set your environment variables:
   - In `backend/.env`:
     ```env
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
     SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
     SUPABASE_KEY=[YOUR-SUPABASE-ANON-KEY]
     SUPABASE_JWT_SECRET=[YOUR-SUPABASE-JWT-SECRET]
     ```
   - In `frontend/.env`:
     ```env
     VITE_API_URL=http://localhost:8000
     VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
     VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
     ```

---

## 🧪 Running Automated Tests

Run the test suite covering categorizer keywords, 30-day window anomaly mathematics, CSV parser, and API endpoints:

```bash
cd backend
.venv/bin/pytest -v
```

---

## 📁 Sample Statement Files for Testing

Sample files are located in `backend/sample_data/`:
1. `mtn_momo_statement_sample.csv` (MTN MoMo transfers, airtime, ECG, food, taxi charter anomaly)
2. `bank_statement_sample.csv` (Bank statement with Debit/Credit columns & CompuGhana laptop anomaly)
3. `sme_sales_and_expenses_sample.csv` (SME boutique sales, Makola wholesale, dispatch rider)

You can also download sample templates directly inside the app on the **Statement Import** page.
