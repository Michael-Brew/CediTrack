from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, AuthenticatedUser
from app.models import Account, Transaction, UploadLog, Category
from app.schemas import CSVPreviewResponse, CSVCommitRequest, CSVCommitResponse
from app.services.file_parser import parse_statement_file
from app.services.anomaly_detector import evaluate_transaction_anomaly

router = APIRouter(prefix="/api/upload", tags=["Upload"])

@router.post("/preview", response_model=CSVPreviewResponse)
async def upload_and_preview_statement(
    file: UploadFile = File(...),
    default_account_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    # Validate file format
    filename = file.filename or "statement.csv"
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a .csv, .xlsx, or .xls file."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Max 10MB file size safeguard
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    # Fetch user's accounts
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    available_accounts = [{"id": acc.id, "name": acc.name, "type": acc.type} for acc in accounts]

    # Fetch system and user categories
    categories = db.query(Category).filter(
        (Category.user_id == user.id) | (Category.user_id == None)
    ).all()
    available_categories = sorted(list(set(c.name for c in categories)))

    if not available_categories:
        available_categories = [
            "Salary", "Business Income", "Gift/Remittance", "Susu Payout", "Investment/Interest", "Other Income",
            "Transport", "Food", "MoMo/Airtime", "Data Bundle", "Rent", "Bills", "Susu/Savings",
            "Entertainment", "Personal Care", "Inventory/Supplies", "Logistics/Delivery", "Marketing", "Other Expense"
        ]

    try:
        preview_res = parse_statement_file(
            content=content,
            filename=filename,
            available_accounts=available_accounts,
            available_categories=available_categories,
            default_account_id=default_account_id
        )
        return preview_res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process statement: {str(e)}")

@router.post("/commit", response_model=CSVCommitResponse)
def commit_reviewed_transactions(
    payload: CSVCommitRequest,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    if not payload.transactions:
        raise HTTPException(status_code=400, detail="No transactions to commit.")

    # Fetch accounts map for verification
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    account_ids = {acc.id for acc in accounts}

    if not account_ids:
        raise HTTPException(status_code=400, detail="Please create at least one Account before importing transactions.")

    # Fallback account if needed
    default_acc_id = accounts[0].id

    imported_count = 0
    flagged_anomalies_count = 0

    for row in payload.transactions:
        # Validate account id
        acc_id = row.account_id if row.account_id in account_ids else default_acc_id

        is_flagged = False
        anomaly_reason = None

        if row.type == "Expense":
            is_flagged, anomaly_reason, _, _ = evaluate_transaction_anomaly(
                db=db,
                user_id=user.id,
                txn_date=row.date,
                category=row.category,
                amount=row.amount,
                description=row.description,
                window_days=30
            )

        if is_flagged:
            flagged_anomalies_count += 1

        t = Transaction(
            user_id=user.id,
            account_id=acc_id,
            date=row.date,
            description=row.description,
            amount=row.amount,
            type=row.type,
            category=row.category,
            is_flagged_anomaly=is_flagged,
            anomaly_reason=anomaly_reason,
            source="csv_upload",
            reference_id=row.reference_id
        )
        db.add(t)
        imported_count += 1

    # Log upload
    upload_log = UploadLog(
        user_id=user.id,
        filename=payload.filename,
        row_count=imported_count,
        status="completed"
    )
    db.add(upload_log)

    db.commit()

    return CSVCommitResponse(
        success=True,
        imported_count=imported_count,
        flagged_anomalies_count=flagged_anomalies_count,
        message=f"Successfully imported {imported_count} transactions ({flagged_anomalies_count} flagged for review)."
    )

@router.get("/templates/{template_type}")
def download_statement_template(template_type: str):
    """
    Returns CSV template sample files for testing and reference.
    """
    if template_type == "momo":
        csv_content = (
            "Date,Description,Amount,Type,Reference\n"
            "12/08/2026,Cash In at MTN Agent Circle,500.00,Income,TXN982341\n"
            "13/08/2026,Payment to Waakye Joint,35.00,Expense,TXN982342\n"
            "14/08/2026,Transfer to GCB Account,200.00,Expense,TXN982343\n"
            "15/08/2026,Airtime Purchase 0244123456,20.00,Expense,TXN982344\n"
            "15/08/2026,Received from Brother UK,1200.00,Income,TXN982345\n"
        )
        filename = "mtn_momo_statement_template.csv"
    elif template_type == "bank":
        csv_content = (
            "Date,Narration,Debit,Credit,Balance\n"
            "01/08/2026,Monthly Payroll Salary,,6500.00,12500.00\n"
            "03/08/2026,ECG Power Prepaid Token,150.00,,12350.00\n"
            "05/08/2026,Melcom Shopping Groceries,420.00,,11930.00\n"
            "08/08/2026,Fuel Goil Airport Station,300.00,,11630.00\n"
            "10/08/2026,ATM Cash Withdrawal,500.00,,11130.00\n"
        )
        filename = "bank_statement_template.csv"
    else:  # SME
        csv_content = (
            "Date,Details,Amount,Type,Account,Category\n"
            "10/08/2026,Daily Boutique Sales Cash,850.00,Income,Shop Cash Till,Business Income\n"
            "11/08/2026,Makola Wholesale Fabric Restock,1200.00,Expense,Shop Cash Till,Inventory/Supplies\n"
            "12/08/2026,Dispatch Rider Delivery to East Legon,40.00,Expense,MTN MoMo,Logistics/Delivery\n"
            "13/08/2026,Instagram Sponsored Ad,150.00,Expense,GCB Main Account,Marketing\n"
            "14/08/2026,Online Customer Payment via MoMo,450.00,Income,MTN MoMo,Business Income\n"
        )
        filename = "sme_daily_records_template.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
