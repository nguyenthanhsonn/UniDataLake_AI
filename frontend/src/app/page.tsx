export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-50">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">UniLake AI</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Data Lake đa nguồn tích hợp AI Analytics cho quản trị đại học
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Dashboard và chatbot hỗ trợ truy vấn dữ liệu, phân tích kịch bản và ra quyết định nhanh
          hơn dựa trên dữ liệu chuẩn hóa.
        </p>
      </section>
    </main>
  )
}
