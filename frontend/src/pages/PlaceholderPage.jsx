function PlaceholderPage({ title, description }) {
  return (
    <main className="page-content">
      <span className="eyebrow">SECURITY OPERATIONS</span>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
      <section className="placeholder-panel">
        <h2>{title}</h2>
        <p>This area is set up for a future project step. No functionality is implemented yet.</p>
      </section>
    </main>
  )
}

export default PlaceholderPage
