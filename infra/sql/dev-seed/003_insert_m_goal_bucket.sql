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
        ('メイン銀行', '生活口座', '定期支払', true),
        ('メイン銀行', '生活口座', '生活イベント', true),
        ('貯蓄用銀行', '積立口座', '旅行', true),
        ('貯蓄用銀行', '積立口座', '特別費', true)
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
