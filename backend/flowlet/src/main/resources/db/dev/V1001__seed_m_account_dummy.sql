insert into flowlet.m_account (
    bank_name,
    account_name,
    account_type,
    is_active
)
select seed.bank_name,
       seed.account_name,
       seed.account_type,
       seed.is_active
from (
    values
        ('Demo Bank', 'Main Checking', 'CHECKING', true),
        ('Demo Bank', 'Living Expenses', 'CHECKING', true),
        ('Sample Savings', 'Emergency Fund', 'SAVINGS', true),
        ('Wallet Mock', 'Cash Wallet', 'CHECKING', true),
        ('Travel Mock', 'Travel Reserve', 'SAVINGS', false)
) as seed(bank_name, account_name, account_type, is_active)
where not exists (
    select 1
    from flowlet.m_account existing
    where existing.bank_name = seed.bank_name
      and existing.account_name = seed.account_name
);
