export default function ZonesPage() {
    return (
        <main
            style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#2563eb",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "10px",
                }}
            >
                Settings
            </div>

            <h1
                style={{
                    margin: 0,
                    fontSize: "30px",
                    lineHeight: 1.15,
                    fontWeight: 800,
                    color: "#111827",
                }}
            >
                Зоны (полигоны)
            </h1>

            <p
                style={{
                    marginTop: "10px",
                    marginBottom: 0,
                    fontSize: "15px",
                    lineHeight: 1.7,
                    color: "#4b5563",
                    maxWidth: "760px",
                }}
            >
                Здесь будут настраиваться геозоны, полигоны доставки, ограничения по
                зонам и стоимость доставки по зонам.
            </p>
        </main>
    );
}