insert into flowlet.m_account (
    provider_name,
    account_name,
    account_category,
    balance_side,
    is_active,
    display_order
)
select seed.provider_name,
       seed.account_name,
       seed.account_category,
       seed.balance_side,
       seed.is_active,
       seed.display_order
from (
    values
        ('住信SBIネット銀行', 'メイン口座', 'BANK', 'ASSET', true, 10),
        ('住信SBIネット銀行', '貯金口座', 'BANK', 'ASSET', true, 20),
        ('楽天カード', '楽天カード', 'CREDIT_CARD', 'LIABILITY', true, 30),
        ('現金', '財布', 'CASH', 'ASSET', true, 40)
) as seed(provider_name, account_name, account_category, balance_side, is_active, display_order)
where not exists (
    select 1
    from flowlet.m_account existing
    where existing.provider_name = seed.provider_name
      and existing.account_name = seed.account_name
      and existing.account_category = seed.account_category
);

insert into flowlet.m_credit_card_profile (
    account_id,
    payment_account_id,
    closing_day,
    payment_day,
    payment_date_adjustment_rule
)
select card.account_id,
       payment.account_id,
       25,
       27,
       'NEXT_BUSINESS_DAY'
from flowlet.m_account card
join flowlet.m_account payment
    on payment.provider_name = '住信SBIネット銀行'
   and payment.account_name = 'メイン口座'
   and payment.account_category = 'BANK'
where card.provider_name = '楽天カード'
  and card.account_name = '楽天カード'
  and card.account_category = 'CREDIT_CARD'
  and not exists (
      select 1
      from flowlet.m_credit_card_profile existing
      where existing.account_id = card.account_id
  );
