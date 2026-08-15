from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user, AuthenticatedUser
from app.models import Account, Transaction
from app.schemas import AccountCreate, AccountUpdate, AccountResponse, TransferRequest

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

def get_account_response(acc: Account, db: Session) -> AccountResponse:
    # Compute current balance, total income, total expense
    txns = db.query(Transaction).filter(Transaction.account_id == acc.id).all()
    inc = sum((t.amount for t in txns if t.type == "Income"), Decimal("0.00"))
    exp = sum((t.amount for t in txns if t.type == "Expense"), Decimal("0.00"))
    current_bal = Decimal(str(acc.initial_balance)) + inc - exp

    return AccountResponse(
        id=acc.id,
        user_id=acc.user_id,
        name=acc.name,
        type=acc.type,
        initial_balance=acc.initial_balance,
        currency=acc.currency,
        color=acc.color or "#10B981",
        current_balance=current_bal,
        total_income=inc,
        total_expense=exp,
        transaction_count=len(txns),
        created_at=acc.created_at,
        updated_at=acc.updated_at
    )

@router.get("", response_model=List[AccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    accounts = db.query(Account).filter(Account.user_id == user.id).order_by(Account.created_at.asc()).all()
    return [get_account_response(acc, db) for acc in accounts]

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    acc = Account(
        user_id=user.id,
        name=payload.name,
        type=payload.type,
        initial_balance=payload.initial_balance,
        currency=payload.currency,
        color=payload.color or "#10B981"
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return get_account_response(acc, db)

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return get_account_response(acc, db)

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: str,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    if payload.name is not None:
        acc.name = payload.name
    if payload.type is not None:
        acc.type = payload.type
    if payload.initial_balance is not None:
        acc.initial_balance = payload.initial_balance
    if payload.currency is not None:
        acc.currency = payload.currency
    if payload.color is not None:
        acc.color = payload.color

    db.commit()
    db.refresh(acc)
    return get_account_response(acc, db)

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(acc)
    db.commit()
    return None

@router.post("/transfer")
def transfer_between_accounts(
    payload: TransferRequest,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    if payload.from_account_id == payload.to_account_id:
        raise HTTPException(status_code=400, detail="From and To accounts must be different.")

    from_acc = db.query(Account).filter(Account.id == payload.from_account_id, Account.user_id == user.id).first()
    to_acc = db.query(Account).filter(Account.id == payload.to_account_id, Account.user_id == user.id).first()

    if not from_acc or not to_acc:
        raise HTTPException(status_code=404, detail="One or both accounts not found.")

    desc_out = f"Transfer to {to_acc.name}: {payload.description}"
    desc_in = f"Transfer from {from_acc.name}: {payload.description}"

    debit_txn = Transaction(
        user_id=user.id,
        account_id=from_acc.id,
        date=payload.date,
        description=desc_out,
        amount=payload.amount,
        type="Expense",
        category="MoMo/Airtime" if "momo" in from_acc.name.lower() else "Other Expense",
        source="manual"
    )
    credit_txn = Transaction(
        user_id=user.id,
        account_id=to_acc.id,
        date=payload.date,
        description=desc_in,
        amount=payload.amount,
        type="Income",
        category="Other Income",
        source="manual"
    )

    db.add(debit_txn)
    db.add(credit_txn)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully transferred ₵{payload.amount:,.2f} from {from_acc.name} to {to_acc.name}"
    }
