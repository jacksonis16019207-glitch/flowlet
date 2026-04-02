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
        ('住信SBIネット銀行', 'メイン口座', '生活防衛', true),
        ('住信SBIネット銀行', '貯金口座', '旅行', true),
        ('住信SBIネット銀行', '貯金口座', '特別費', true)
) as seed(provider_name, account_name, bucket_name, is_active)
join flowlet.m_account account
    on account.provider_name = seed.provider_name
   and account.account_name = seed.account_name
where not exists (
    select 1
    from flowlet.m_goal_bucket existing
    where existing.account_id = account.account_id
      and existing.bucket_name = seed.bucket_name
);
