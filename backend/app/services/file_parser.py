import io
import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import pypdf

from app.schemas import CSVPreviewRow, CSVPreviewResponse
from app.services.categorizer import categorize, resolve_account_from_text

def clean_amount(val: Any) -> Tuple[Optional[Decimal], Optional[str]]:
    """
    Cleans amount string, handles Ghanaian currency symbols, commas, negative formats (e.g. (50.00)).
    Returns (cleaned_amount: Decimal, detected_sign: 'positive' | 'negative' | None)
    """
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None, None

    s = str(val).strip()
    # Check parenthesized negative e.g. (150.00)
    is_negative = False
    if s.startswith("(") and s.endswith(")"):
        is_negative = True
        s = s[1:-1]
    elif s.startswith("-"):
        is_negative = True
        s = s[1:]

    # Remove currency codes and symbols (including both Ghana Cedi ₵ U+20B5 and ¢ U+00A2)
    s = re.sub(r'(?i)(ghs|gh¢|gh₵|¢|₵|usd|\$|eur|€|,|\s)', '', s)

    try:
        amt = Decimal(s)
        if amt < 0:
            return abs(amt), "negative"
        if is_negative:
            return amt, "negative"
        return amt, "positive"
    except (InvalidOperation, ValueError):
        return None, None

def parse_date_flexible(val: Any) -> Optional[date]:
    """
    Tries multiple common Ghanaian and international date formats.
    """
    if pd.isna(val) or val is None:
        return None

    if isinstance(val, (datetime, pd.Timestamp)):
        return val.date()
    if isinstance(val, date):
        return val

    s = str(val).strip()
    # Strip time component if present
    s_date_only = re.split(r'[ T]', s)[0]

    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
        "%Y-%m-%d", "%Y/%m/%d",
        "%m/%d/%Y", "%m-%d-%Y",
        "%d/%m/%y", "%d-%m-%y",
        "%d %b %Y", "%d-%b-%Y", "%d %B %Y",
        "%Y%m%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(s_date_only, fmt).date()
        except ValueError:
            continue

    # Fallback to pandas to_datetime
    try:
        dt = pd.to_datetime(s, dayfirst=True)
        return dt.date()
    except Exception:
        return None

def detect_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """
    Identifies column mappings for date, description, amount, debit, credit, type, and account.
    """
    cols = [str(c).strip() for c in df.columns]
    mapping: Dict[str, Optional[str]] = {
        "date": None,
        "description": None,
        "amount": None,
        "debit": None,
        "credit": None,
        "type": None,
        "account": None,
        "reference": None,
    }

    for col in cols:
        norm = col.lower().replace("_", " ").replace("-", " ").strip()

        # Date
        if not mapping["date"] and any(k in norm for k in ["date", "txn date", "trans date", "time", "timestamp", "value date"]):
            mapping["date"] = col

        # Description
        elif not mapping["description"] and any(k in norm for k in ["desc", "narration", "detail", "particular", "transaction", "memo", "remarks", "party", "from/to"]):
            mapping["description"] = col

        # Debit
        elif not mapping["debit"] and any(k in norm for k in ["debit", "withdrawal", "money out", "dr", "paid out", "expense"]):
            mapping["debit"] = col

        # Credit
        elif not mapping["credit"] and any(k in norm for k in ["credit", "deposit", "money in", "cr", "received", "income"]):
            mapping["credit"] = col

        # Amount
        elif not mapping["amount"] and any(k in norm for k in ["amount", "txn amount", "trans amount", "total", "net"]):
            mapping["amount"] = col

        # Type
        elif not mapping["type"] and any(k in norm for k in ["type", "trans type", "txn type", "direction", "cr/dr"]):
            mapping["type"] = col

        # Account
        elif not mapping["account"] and any(k in norm for k in ["account", "wallet", "source", "bank", "network", "channel", "till"]):
            mapping["account"] = col

        # Reference
        elif not mapping["reference"] and any(k in norm for k in ["ref", "reference", "id", "trans id", "txn id", "receipt"]):
            mapping["reference"] = col

    return mapping

def extract_transactions_from_pdf(content: bytes) -> pd.DataFrame:
    """
    Extracts structured transactions from bank and mobile money PDF statements.
    Supports GCB, Ecobank, Stanbic, Absa, Fidelity, CalBank, MTN MoMo, Telecel Cash, AT Money statements.
    """
    reader = pypdf.PdfReader(io.BytesIO(content))
    all_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            all_text += "\n" + txt

    if not all_text.strip():
        raise ValueError("Could not extract readable text from this PDF statement. Please ensure it is not an image-only scan.")

    DATE_REGEX = re.compile(
        r'\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}|\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b',
        re.IGNORECASE
    )
    AMOUNT_REGEX = re.compile(r'\(?\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})\b\)?')
    REF_REGEX = re.compile(r'\b(?:TXN|REF|RECEIPT|ID)[\s:#-]*([A-Z0-9]{5,24})\b', re.IGNORECASE)

    rows = []
    current_row = None

    lines = all_text.split('\n')
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        line_lower = line.lower()
        # Skip headers, footers, summary metrics
        if any(h in line_lower for h in [
            'statement of account', 'page ', 'opening balance', 'closing balance',
            'total debit', 'total credit', 'account summary', 'account number:', 'balance b/f', 'balance c/f'
        ]):
            continue

        date_match = DATE_REGEX.search(line)
        if date_match:
            if current_row:
                rows.append(current_row)

            d_str = date_match.group(1)
            remainder = line[date_match.end():].strip()

            amounts = AMOUNT_REGEX.findall(remainder)
            ref_match = REF_REGEX.search(remainder)
            ref_id = ref_match.group(1) if ref_match else None

            first_amt_match = AMOUNT_REGEX.search(remainder)
            if first_amt_match:
                desc = remainder[:first_amt_match.start()].strip()
                raw_amt = first_amt_match.group(0)
            else:
                desc = remainder
                raw_amt = None

            line_upper = line.upper()
            is_income = False
            if ' CR' in line_upper or 'CREDIT' in line_upper or any(w in desc.lower() for w in ['salary', 'cash in', 'received', 'deposit', 'refund', 'reversal', 'interest']):
                is_income = True
            elif ' DR' in line_upper or 'DEBIT' in line_upper or (raw_amt and raw_amt.startswith('(')) or any(w in desc.lower() for w in ['payment', 'cash out', 'transfer to', 'withdrawal', 'fee', 'charge', 'e-levy', 'airtime', 'token', 'bill']):
                is_income = False
            else:
                is_income = False

            current_row = {
                'date': d_str,
                'description': desc or 'Transaction',
                'amount': raw_amt,
                'type': 'Income' if is_income else 'Expense',
                'reference': ref_id
            }
        elif current_row and not AMOUNT_REGEX.search(line):
            # Append multi-line narration
            current_row['description'] += ' ' + line

    if current_row:
        rows.append(current_row)

    if not rows:
        raise ValueError("No transaction rows could be recognized in this PDF. Please check if the statement contains tabular date and amount entries.")

    return pd.DataFrame(rows)

def parse_statement_file(
    content: bytes,
    filename: str,
    available_accounts: List[Dict[str, Any]],
    available_categories: List[str],
    default_account_id: Optional[str] = None
) -> CSVPreviewResponse:
    """
    Parses a PDF, CSV, or Excel statement file and returns a structured preview response.
    """
    filename_lower = filename.lower()
    is_pdf = filename_lower.endswith(".pdf")
    is_excel = filename_lower.endswith((".xlsx", ".xls"))

    try:
        if is_pdf:
            df = extract_transactions_from_pdf(content)
            detected_format = "PDF Statement (MoMo / Bank)"
        elif is_excel:
            df = pd.read_excel(io.BytesIO(content))
            detected_format = "Excel Spreadsheet"
        else:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding="latin-1")
            detected_format = "CSV Statement"
    except Exception as e:
        raise ValueError(f"Could not parse file '{filename}': {str(e)}")

    if df.empty:
        raise ValueError("The uploaded statement file is empty.")

    # Remove completely empty rows
    df = df.dropna(how="all").reset_index(drop=True)

    col_map = detect_columns(df)

    has_debit_credit = bool(col_map["debit"] and col_map["credit"])
    has_single_amount = bool(col_map["amount"])

    if not is_pdf:
        if has_debit_credit:
            detected_format = "Debit / Credit Columns"
        elif has_single_amount:
            detected_format = "Single Amount Column"
        else:
            for c in df.columns:
                if c != col_map["date"] and c != col_map["description"]:
                    col_map["amount"] = c
                    detected_format = "Inferred Amount Column"
                    break

    rows: List[CSVPreviewRow] = []
    valid_count = 0
    invalid_count = 0

    account_map = {acc["id"]: acc["name"] for acc in available_accounts}

    # Find "Other" account ID if present among available accounts to use as smart fallback
    other_account = next((a for a in available_accounts if a.get("name", "").lower() == "other" or a.get("type", "").lower() == "other"), None)
    fallback_acc_id = default_account_id or (other_account["id"] if other_account else (available_accounts[0]["id"] if available_accounts else None))

    for idx, raw_row in df.iterrows():
        row_dict = raw_row.to_dict()
        is_valid = True
        error_msg = None

        # 1. Parse Date
        parsed_d = None
        if col_map["date"] and col_map["date"] in row_dict:
            parsed_d = parse_date_flexible(row_dict[col_map["date"]])
        if not parsed_d:
            for c, val in row_dict.items():
                parsed_d = parse_date_flexible(val)
                if parsed_d:
                    break

        date_str = parsed_d.strftime("%Y-%m-%d") if parsed_d else ""
        if not date_str:
            is_valid = False
            error_msg = "Invalid or missing date"

        # 2. Parse Description
        desc = ""
        if col_map["description"] and col_map["description"] in row_dict:
            desc = str(row_dict[col_map["description"]] or "").strip()
        if not desc or desc == "nan":
            for c, val in row_dict.items():
                if c not in [col_map["date"], col_map["amount"], col_map["debit"], col_map["credit"]]:
                    if pd.notna(val) and len(str(val).strip()) > 1:
                        desc = str(val).strip()
                        break
            if not desc or desc == "nan":
                desc = "Transaction"

        # 3. Parse Amount & Type
        amount: Optional[Decimal] = None
        txn_type = "Expense"

        if has_debit_credit:
            debit_val = row_dict.get(col_map["debit"])
            credit_val = row_dict.get(col_map["credit"])
            d_amt, _ = clean_amount(debit_val)
            c_amt, _ = clean_amount(credit_val)

            if d_amt and d_amt > 0:
                amount = d_amt
                txn_type = "Expense"
            elif c_amt and c_amt > 0:
                amount = c_amt
                txn_type = "Income"
            else:
                is_valid = False
                error_msg = error_msg or "Missing or zero Debit/Credit amount"
                amount = Decimal("0.00")
        else:
            amt_col_name = col_map["amount"]
            raw_amt = row_dict.get(amt_col_name) if amt_col_name else None
            parsed_amt, sign = clean_amount(raw_amt)

            if parsed_amt is not None and parsed_amt > 0:
                amount = parsed_amt
                if col_map["type"] and col_map["type"] in row_dict:
                    type_str = str(row_dict[col_map["type"]]).lower()
                    if any(w in type_str for w in ["cr", "credit", "in", "deposit", "income", "received"]):
                        txn_type = "Income"
                    elif any(w in type_str for w in ["dr", "debit", "out", "withdrawal", "expense", "paid"]):
                        txn_type = "Expense"
                    else:
                        txn_type = "Income" if sign == "positive" else "Expense"
                else:
                    if sign == "negative":
                        txn_type = "Expense"
                    elif any(w in desc.lower() for w in ["received from", "deposit", "salary", "refund", "cash in"]):
                        txn_type = "Income"
                    else:
                        txn_type = "Expense"
            else:
                is_valid = False
                error_msg = error_msg or "Invalid amount"
                amount = Decimal("0.00")

        # 4. Auto-categorize
        inferred_category = categorize(desc, txn_type)

        # 5. Account resolution
        source_text = ""
        if col_map["account"] and col_map["account"] in row_dict:
            source_text = str(row_dict[col_map["account"]] or "")

        res_acc_id, res_acc_name, conf_acc = resolve_account_from_text(
            source_text or desc,
            available_accounts
        )

        final_acc_id = res_acc_id or fallback_acc_id
        final_acc_name = account_map.get(final_acc_id, res_acc_name or "Other")

        # Extract reference if present
        ref_val = None
        if col_map["reference"] and col_map["reference"] in row_dict:
            ref_raw = str(row_dict[col_map["reference"]] or "").strip()
            if ref_raw and ref_raw != "nan":
                ref_val = ref_raw

        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        rows.append(
            CSVPreviewRow(
                row_index=idx,
                date=date_str,
                description=desc,
                amount=amount if amount is not None else Decimal("0.00"),
                type=txn_type,
                category=inferred_category,
                account_id=final_acc_id,
                account_name=final_acc_name,
                raw_source=source_text or None,
                is_valid=is_valid,
                validation_error=error_msg,
                confidence_category=0.9 if inferred_category not in ["Other Income", "Other Expense"] else 0.5,
                confidence_account=conf_acc
            )
        )

    return CSVPreviewResponse(
        filename=filename,
        total_rows=len(rows),
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        detected_format=detected_format,
        rows=rows,
        available_accounts=available_accounts,
        available_categories=available_categories
    )
