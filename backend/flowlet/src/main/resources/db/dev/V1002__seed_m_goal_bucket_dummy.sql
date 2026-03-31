insert into flowlet.m_goal_bucket (
    account_id,
    bucket_name,
    is_active
)
select account.account_id,
       seed.bucket_name,
       seed.is_active
from (
    values
        ('Demo Bank', 'Main Checking', 'Emergency Buffer', true),
        ('Demo Bank', 'Main Checking', 'Fixed Cost Reserve', true),
        ('Demo Bank', 'Living Expenses', 'Groceries', true),
        ('Sample Savings', 'Emergency Fund', 'Home Appliances', true),
        ('Sample Savings', 'Emergency Fund', 'Long-Term Reserve', true),
        ('Wallet Mock', 'Cash Wallet', 'Weekend Spending', true),
        ('Travel Mock', 'Travel Reserve', 'Summer Trip', false)
) as seed(bank_name, account_name, bucket_name, is_active)
join flowlet.m_account account
    on account.bank_name = seed.bank_name
   and account.account_name = seed.account_name
where not exists (
    select 1
    from flowlet.m_goal_bucket existing
    where existing.account_id = account.account_id
      and existing.bucket_name = seed.bucket_name
);
