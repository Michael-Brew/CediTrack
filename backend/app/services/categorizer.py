import re
from typing import Optional, List, Dict, Any, Tuple

INCOME_CATEGORIES = {
    "Salary": [
        "salary", "wages", "payroll", "stipend", "allowance", "bonus", "paycheck", "monthly pay"
    ],
    "Business Income": [
        "sales", "business income", "client payment", "customer payment", "invoice", "pos sale",
        "shop till", "revenue", "daily sales", "service fee", "consulting fee", "shop payment"
    ],
    "Gift/Remittance": [
        "gift", "remittance", "family support", "western union", "sendwave", "worldremit",
        "tap tap send", "taptap", "moneygram", "cashout", "from bro", "from sis", "from mum", "from dad"
    ],
    "Susu Payout": [
        "susu payout", "susu collection", "susu share", "susu withdrawal"
    ],
    "Investment/Interest": [
        "interest", "dividend", "investment", "treasury bill", "t-bill", "mutual fund", "datacenter", "roi"
    ],
}

# Order of precedence: more specific compound keywords first
EXPENSE_CATEGORIES = {
    "Data Bundle": [
        "data bundle", "internet", "wifi", "mtn fiber", "turbonet", "surfline", "telesol",
        "fibre", "broadband", "gigabytes", "data"
    ],
    "Transport": [
        "trotro", "taxi", "uber", "bolt", "yango", "fuel", "petrol", "diesel", "goil", "shell",
        "total", "totalenergies", "star oil", "fare", "transport", "bus fare", "vip bus",
        "circle to", "car wash", "mechanic", "toll"
    ],
    "Food": [
        "chop bar", "waakye", "jollof", "restaurant", "food", "lunch", "dinner", "breakfast",
        "kfc", "pizzaman", "chickenman", "papaye", "buka", "kenkey", "banku", "fufu", "ice cream",
        "supermarket", "shoprite", "melcom", "maxmart", "palace mall", "groceries", "market woman",
        "fried rice", "shawarma", "cafe"
    ],
    "Rent": [
        "rent", "landlord", "landlady", "estate agent", "room rent", "office rent", "advance rent"
    ],
    "Bills": [
        "electricity", "ecg", "prepaid", "power", "water bill", "gwcl", "utility", "dstv",
        "gotv", "startimes", "refuse", "waste management", "zoomlion"
    ],
    "Susu/Savings": [
        "susu", "savings", "contribution", "susu deposit", "emergency fund", "piggy", "daily susu"
    ],
    "Inventory/Supplies": [
        "inventory", "stock", "supplies", "wholesale", "raw materials", "packaging", "kantanto",
        "makola", "opera square", "restock", "goods purchase", "carton"
    ],
    "Logistics/Delivery": [
        "delivery", "courier", "dispatch", "rider", "freight", "shipping", "customs",
        "fedex", "dhl", "errand", "waybill"
    ],
    "Marketing": [
        "facebook ad", "instagram ad", "google ad", "ad", "marketing", "flyer", "printing",
        "influencer", "billboard", "promo", "branding", "banner"
    ],
    "Personal Care": [
        "salon", "barber", "cosmetics", "pharmacy", "chemist", "drugs", "hospital", "clinic",
        "spa", "haircut", "braids", "skincare", "dental", "gym", "laundry"
    ],
    "Entertainment": [
        "netflix", "cinema", "spotify", "showmax", "silverbird", "club", "lounge", "hangout",
        "drinks", "bar", "concert", "movie", "outing", "party", "pub"
    ],
    "MoMo/Airtime": [
        "momo", "airtime", "mtn", "telecel", "vodafone", "airteltigo", "at money", "recharge",
        "momo charge", "cash out fee", "e-levy", "transfer fee", "airtime top up"
    ],
}

ACCOUNT_LOOKUP = {
    "MTN MoMo": [
        "mtn", "momo", "mtn momo", "mobile money", "mtn mobile money", "024", "054", "055", "059", "025", "yello"
    ],
    "Telecel Cash": [
        "telecel", "vodafone", "voda", "vodacash", "telecel cash", "020", "050"
    ],
    "AT Money": [
        "airteltigo", "at money", "airtel", "tigo", "027", "057", "026"
    ],
    "GCB Bank": [
        "gcb", "ghana commercial bank", "gcb bank", "gcb mobile"
    ],
    "Ecobank": [
        "ecobank", "eco bank", "ecobank mobile", "pan african bank"
    ],
    "Absa": [
        "absa", "barclays", "absa bank"
    ],
    "Stanbic": [
        "stanbic", "stanbic bank"
    ],
    "Fidelity": [
        "fidelity", "fidelity bank"
    ],
    "CalBank": [
        "calbank", "cal bank"
    ],
    "Zenith": [
        "zenith", "zenith bank"
    ],
    "Access Bank": [
        "access", "access bank"
    ],
    "Cash": [
        "cash", "till", "petty cash", "wallet", "hand", "drawer", "cash box", "pocket"
    ],
    "Susu Box": [
        "susu", "susu box", "savings box", "susu collector"
    ]
}

def categorize(description: str, txn_type: str = "Expense") -> str:
    """
    Categorize a transaction based on Ghanaian keywords in the narration/description.
    """
    if not description:
        return "Other Income" if txn_type == "Income" else "Other Expense"

    norm_desc = description.lower()

    if txn_type == "Income":
        for category, keywords in INCOME_CATEGORIES.items():
            for kw in keywords:
                if kw in norm_desc:
                    return category
        return "Other Income"
    else:
        for category, keywords in EXPENSE_CATEGORIES.items():
            for kw in keywords:
                if kw in norm_desc:
                    return category
        return "Other Expense"

def resolve_account_from_text(text: str, available_accounts: Optional[List[Dict[str, Any]]] = None) -> Tuple[Optional[str], Optional[str], float]:
    """
    Infers the account from a text string (column value or narration).
    Returns (account_id, account_name, confidence).
    """
    if not text:
        return None, None, 0.0

    norm_text = text.lower().strip()

    # 1. Exact or partial match with user's available accounts if provided
    if available_accounts:
        for acc in available_accounts:
            acc_name = acc.get("name", "")
            acc_norm = acc_name.lower().strip()
            # Exact match
            if norm_text == acc_norm:
                return acc.get("id"), acc_name, 1.0
            # Substring match
            if acc_norm in norm_text or norm_text in acc_norm:
                return acc.get("id"), acc_name, 0.9

    # 2. Match against common Ghanaian financial institution lookup
    matched_target = None
    matched_keywords = []
    for standard_name, keywords in ACCOUNT_LOOKUP.items():
        for kw in keywords:
            # Word boundary or containment
            if re.search(r'\b' + re.escape(kw) + r'\b', norm_text) or (len(kw) > 3 and kw in norm_text):
                matched_target = standard_name
                matched_keywords = keywords
                break
        if matched_target:
            break

    if matched_target:
        # If user has an account matching this standard name or keyword overlap, return that account
        if available_accounts:
            for acc in available_accounts:
                acc_name = acc.get("name", "")
                acc_lower = acc_name.lower()
                if matched_target.lower() in acc_lower or acc_lower in matched_target.lower():
                    return acc.get("id"), acc_name, 0.85
                # Match any keyword overlap (e.g. "gcb" in "GCB Main Account")
                for kw in matched_keywords:
                    if kw in acc_lower:
                        return acc.get("id"), acc_name, 0.85

        return None, matched_target, 0.75

    return None, None, 0.0
