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
        ('みらい銀行', '生活口座', '緊急予備費', true),
        ('みらい銀行', '生活口座', '固定費準備', true),
        ('みらい銀行', '支出口座', '食費', true),
        ('ひかり貯蓄銀行', '緊急積立', '家電買い替え', true),
        ('ひかり貯蓄銀行', '緊急積立', '長期積立', true),
        ('まいにちウォレット', '現金管理', '週末予算', true),
        ('そらたび積立', '旅行積立', '夏休み旅行', false)
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
