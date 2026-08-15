from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(mobile_money|bank|cash|other)$")
    initial_balance: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = Field(default="GHS")
    color: Optional[str] = "#10B981"

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    initial_balance: Optional[Decimal] = None
    currency: Optional[str] = None
    color: Optional[str] = None

class AccountResponse(AccountBase):
    id: str
    user_id: str
    current_balance: Decimal = Decimal("0.00")
    total_income: Decimal = Decimal("0.00")
    total_expense: Decimal = Decimal("0.00")
    transaction_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    type: str = Field(..., pattern="^(Income|Expense)$")
    icon: Optional[str] = "tag"
    color: Optional[str] = "#64748B"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    user_id: Optional[str] = None
    is_system: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    account_id: str
    date: date
    description: str = Field(..., min_length=1)
    amount: Decimal = Field(..., gt=0)
    type: str = Field(..., pattern="^(Income|Expense)$")
    category: str
    source: Optional[str] = "manual"
    reference_id: Optional[str] = None

class TransactionCreate(TransactionBase):
    is_flagged_anomaly: Optional[bool] = False
    anomaly_reason: Optional[str] = None

class TransactionUpdate(BaseModel):
    account_id: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    category: Optional[str] = None
    is_flagged_anomaly: Optional[bool] = None
    anomaly_reason: Optional[str] = None
    reference_id: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    is_flagged_anomaly: bool = False
    anomaly_reason: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Categorization & Resolution Schemas ---
class CategorizeRequest(BaseModel):
    description: str
    type: Optional[str] = "Expense"

class CategorizeResponse(BaseModel):
    category: str
    suggested_account_name: Optional[str] = None
    confidence: float = 1.0

# --- File Upload & Preview Schemas ---
class CSVPreviewRow(BaseModel):
    row_index: int
    date: str
    description: str
    amount: Decimal
    type: str
    category: str
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    raw_source: Optional[str] = None
    is_valid: bool = True
    validation_error: Optional[str] = None
    confidence_category: float = 1.0
    confidence_account: float = 1.0

class CSVPreviewResponse(BaseModel):
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    detected_format: str
    rows: List[CSVPreviewRow]
    available_accounts: List[Dict[str, str]]
    available_categories: List[str]

class CSVCommitRow(BaseModel):
    date: date
    description: str
    amount: Decimal
    type: str
    category: str
    account_id: str
    reference_id: Optional[str] = None

class CSVCommitRequest(BaseModel):
    filename: str
    transactions: List[CSVCommitRow]

class CSVCommitResponse(BaseModel):
    success: bool
    imported_count: int
    flagged_anomalies_count: int
    message: str

# --- Transfer Schemas ---
class TransferRequest(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal = Field(..., gt=0)
    date: date
    description: Optional[str] = "Account Transfer"

# --- Dashboard & Analytics Schemas ---
class DashboardSummary(BaseModel):
    total_net_worth: Decimal
    total_monthly_income: Decimal
    total_monthly_expense: Decimal
    net_savings: Decimal
    savings_rate: float
    total_flagged_anomalies: int
    accounts_count: int
    transactions_count: int

class AccountBalanceHistoryPoint(BaseModel):
    date: str
    balances: Dict[str, float]

class MonthlyIncomeExpensePoint(BaseModel):
    month: str
    income: float
    expense: float
    net: float

class CategorySpendItem(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int
    color: Optional[str] = None

class CategoryChangeItem(BaseModel):
    category: str
    current_month_amount: float
    last_month_amount: float
    percentage_change: float
    trend: str  # up, down, unchanged

class AnomalyAlertItem(BaseModel):
    id: str
    date: date
    description: str
    amount: Decimal
    category: str
    account_name: str
    anomaly_reason: str
    baseline_avg_30d: Optional[float] = None
    baseline_std_30d: Optional[float] = None

class DashboardChartsResponse(BaseModel):
    balance_history: List[AccountBalanceHistoryPoint]
    income_expense_trend: List[MonthlyIncomeExpensePoint]
    category_spending: List[CategorySpendItem]
    top_categories_comparison: List[CategoryChangeItem]
    unusual_spending_alerts: List[AnomalyAlertItem]
