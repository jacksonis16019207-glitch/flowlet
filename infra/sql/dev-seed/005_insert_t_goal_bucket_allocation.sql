insert into flowlet.t_goal_bucket_allocation (
    account_id,
    from_goal_bucket_id,
    to_goal_bucket_id,
    allocation_date,
    amount,
    description,
    note,
    linked_transfer_group_id
)
select bucket.account_id,
       cast(null as bigint),
       bucket.goal_bucket_id,
       date '2026-04-04',
       cast(seed.amount as numeric(19, 2)),
       '初回配分',
       seed.note,
       cast(null as uuid)
from (
    values
        ('旅行', 30000, '旅行積立'),
        ('特別費', 20000, '特別費積立')
) as seed(bucket_name, amount, note)
join flowlet.m_goal_bucket bucket
    on bucket.bucket_name = seed.bucket_name
where not exists (
    select 1
    from flowlet.t_goal_bucket_allocation existing
    where existing.to_goal_bucket_id = bucket.goal_bucket_id
      and existing.allocation_date = date '2026-04-04'
      and existing.amount = seed.amount
);
