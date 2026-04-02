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
