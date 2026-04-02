insert into flowlet.m_category (
    category_name,
    category_type,
    display_order,
    is_active
)
select seed.category_name,
       seed.category_type,
       seed.display_order,
       seed.is_active
from (
    values
        ('給与', 'INCOME', 10, true),
        ('賞与', 'INCOME', 20, true),
        ('一時収入', 'INCOME', 30, true),
        ('事業収入', 'INCOME', 40, true),
        ('副業収入', 'INCOME', 50, true),
        ('年金', 'INCOME', 60, true),
        ('配当所得', 'INCOME', 70, true),
        ('利息所得', 'INCOME', 80, true),
        ('ポイント還元', 'INCOME', 90, true),
        ('立替精算', 'INCOME', 100, true),
        ('還付・返金', 'INCOME', 110, true),
        ('売却収入', 'INCOME', 120, true),
        ('食費', 'EXPENSE', 210, true),
        ('日用品', 'EXPENSE', 220, true),
        ('住居', 'EXPENSE', 230, true),
        ('水道光熱', 'EXPENSE', 240, true),
        ('通信', 'EXPENSE', 250, true),
        ('交通', 'EXPENSE', 260, true),
        ('自動車', 'EXPENSE', 270, true),
        ('社会保険・税金', 'EXPENSE', 280, true),
        ('保険', 'EXPENSE', 290, true),
        ('医療', 'EXPENSE', 300, true),
        ('教育', 'EXPENSE', 310, true),
        ('仕事', 'EXPENSE', 320, true),
        ('衣服・美容', 'EXPENSE', 330, true),
        ('交際', 'EXPENSE', 340, true),
        ('娯楽', 'EXPENSE', 350, true),
        ('サブスク', 'EXPENSE', 360, true),
        ('旅行', 'EXPENSE', 370, true),
        ('特別支出', 'EXPENSE', 380, true),
        ('その他支出', 'EXPENSE', 390, true),
        ('口座間移動', 'TRANSFER', 410, true),
        ('カード引落', 'TRANSFER', 420, true),
        ('電子マネー移動', 'TRANSFER', 430, true),
        ('証券口座移動', 'TRANSFER', 440, true),
        ('現金引き出し', 'TRANSFER', 450, true),
        ('現金預け入れ', 'TRANSFER', 460, true),
        ('振替調整', 'TRANSFER', 470, true)
) as seed(category_name, category_type, display_order, is_active)
where not exists (
    select 1
    from flowlet.m_category existing
    where existing.category_name = seed.category_name
      and existing.category_type = seed.category_type
);
