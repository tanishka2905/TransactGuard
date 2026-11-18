import sqlite3

def run_migration():
    conn = sqlite3.connect("backend/transactguard.db")
    cur = conn.cursor()

    user_cols = [r[1] for r in cur.execute("PRAGMA table_info(users)").fetchall()]
    user_additions = [
        ("balance", "FLOAT DEFAULT 100000.0"),
        ("currency", "VARCHAR(16) DEFAULT 'TGX'"),
        ("avatar", "VARCHAR(256)"),
        ("city", "VARCHAR(64) DEFAULT 'Mumbai, IN'"),
        ("account_number", "VARCHAR(32)")
    ]
    for col, col_type in user_additions:
        if col not in user_cols:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
            print(f"Added users.{col}")

    txn_cols = [r[1] for r in cur.execute("PRAGMA table_info(transactions)").fetchall()]
    txn_additions = [
        ("beneficiary_name", "VARCHAR(128)"),
        ("beneficiary_user_id", "VARCHAR(64)"),
        ("sender_balance_after", "FLOAT"),
        ("beneficiary_balance_after", "FLOAT")
    ]
    for col, col_type in txn_additions:
        if col not in txn_cols:
            cur.execute(f"ALTER TABLE transactions ADD COLUMN {col} {col_type}")
            print(f"Added transactions.{col}")

    # Set initial balances and accounts for seeded users
    user_seeds = {
        "usr_rahul_sharma": (125000.0, "TGX-8821-4910", "Mumbai, IN", "RS"),
        "usr_priya_nair": (240000.0, "TGX-3419-7255", "Bengaluru, IN", "PN"),
        "usr_amit_patel": (850000.0, "TGX-9902-1134", "Ahmedabad, IN", "AP"),
        "usr_sneha_reddy": (95000.0, "TGX-4412-8871", "Hyderabad, IN", "SR"),
        "usr_vikram_singh": (1450000.0, "TGX-7731-0029", "New Delhi, IN", "VS")
    }
    for uid, (bal, acc, cty, avt) in user_seeds.items():
        cur.execute(
            "UPDATE users SET balance = ?, account_number = ?, city = ?, avatar = ?, currency = 'TGX' WHERE id = ?",
            (bal, acc, cty, avt, uid)
        )

    conn.commit()
    conn.close()
    print("Migration and persona balance seeding completed successfully!")

if __name__ == "__main__":
    run_migration()
