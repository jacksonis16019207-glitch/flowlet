const features = [
  '実口座残高の可視化',
  '目的別口座の管理',
  '引き落とし予定と不足判定',
  'CSV取込による履歴投入',
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">flowlet</p>
        <h1>資金配置と引き落とし余力を見える化する。</h1>
        <p className="lead">
          実在する銀行口座とアプリ内の目的別口座を分けて扱い、
          今どこにいくら置いているかと、引き落としに足りるかを確認するための土台です。
        </p>
      </section>

      <section className="card-grid" aria-label="MVP features">
        {features.map((feature) => (
          <article className="feature-card" key={feature}>
            <h2>{feature}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
