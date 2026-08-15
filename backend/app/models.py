import uuid
from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Numeric, Boolean, Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # mobile_money, bank, cash, other
    initial_balance = Column(Numeric(14, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="GHS", nullable=False)
    color = Column(String(20), default="#10B981")
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=True, index=True) # None for global/system categories
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # Income, Expense
    icon = Column(String(50), default="tag")
    color = Column(String(20), default="#64748B")
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(String(20), nullable=False)  # Income, Expense
    category = Column(String(100), nullable=False, index=True)
    is_flagged_anomaly = Column(Boolean, default=False, nullable=False, index=True)
    anomaly_reason = Column(Text, nullable=True)
    source = Column(String(20), default="manual", nullable=False)  # manual, csv_upload
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    account = relationship("Account", back_populates="transactions")

class UploadLog(Base):
    __tablename__ = "upload_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
