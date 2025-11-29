import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

export default function AppPresupuestos() {
  const [fecha, setFecha] = useState({ dia: "", mes: "", año: "" });
  const [cliente, setCliente] = useState("");
  const [incluye, setIncluye] = useState("");
  const [precio, setPrecio] = useState("");
  const [numero, setNumero] = useState(1);
  const [descripcionLibre, setDescripcionLibre] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("presupuestoN");
    if (stored) setNumero(parseInt(stored));
  }, []);

  const handleFechaChange = (e) => {
    const { name, value } = e.target;
    if (name === "dia" || name === "año") {
      if (/^\d*$/.test(value)) setFecha({ ...fecha, [name]: value });
    } else if (name === "mes") {
      if (/^[a-zA-Z]*$/.test(value)) setFecha({ ...fecha, [name]: value });
    }
  };

  const generatePDF = (previewOnly = false) => {
    // Validación de campos obligatorios
    if (
      !cliente.trim() ||
      !fecha.dia.trim() ||
      !fecha.mes.trim() ||
      !fecha.año.trim() ||
      !precio.trim() ||
      !descripcionLibre.trim() ||
      !incluye.trim()
    ) {
      setErrorMessage(
        "Por favor, complete todos los campos obligatorios: Cliente, Fecha, Precio, Descripción e Incluye."
      );
      return;
    } else {
      setErrorMessage("");
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const fondo = new Image();
    fondo.src = process.env.PUBLIC_URL + "/fondobase.png";

    const marginLeft = 20;
    const marginRight = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const yHeader = 67.5;
    const yDate = 72.5;
    const yBottom = 290;
    const yTopContent = 90;

    fondo.onload = () => {
      pdf.addImage(fondo, "PNG", 0, 0, pageWidth, 297);

      pdf.setFontSize(11);
      pdf.text(`Nº ${numero}`, pageWidth - marginRight, 283, { align: "right" });
      pdf.text(`${fecha.dia} ${fecha.mes} ${fecha.año}`, pageWidth - marginRight, yDate, { align: "right" });

      pdf.setFontSize(16);
      pdf.text(`Presupuesto ${cliente}`, marginLeft, yHeader);

      pdf.setFontSize(11.5);
      const introTexto =
        "Es un placer para nosotros presentarle el presupuesto detallado para el servicio que ha solicitado.";
      const introSplit = pdf.splitTextToSize(introTexto, contentWidth);
      pdf.text(introSplit, pageWidth / 2, yTopContent, { align: "center" });

      const introHeight = introSplit.length * 6;
      const yDesc = yTopContent + introHeight + 8;

      pdf.setFontSize(13);
      pdf.text("Descripción", pageWidth / 2, yDesc, { align: "center" });

      const espacioTituloACuadro = 6;

      pdf.setFontSize(11);
      const lineasDescripcion = descripcionLibre.split("\n");
      let textoHeight = 0;
      lineasDescripcion.forEach((linea) => {
        if (linea.trim() === "") {
          textoHeight += 6;
          return;
        }
        const partes = pdf.splitTextToSize(linea, contentWidth);
        textoHeight += partes.length * 6;
      });

      const paddingTop = 6;
      const paddingBottom = 6;

      const rectX = marginLeft;
      const rectY = yDesc + espacioTituloACuadro;
      const rectWidth = contentWidth;
      const rectHeight = textoHeight + paddingTop + paddingBottom;

      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(rectX, rectY, rectWidth, rectHeight);

      const yStart = rectY + paddingTop + (rectHeight - paddingTop - paddingBottom - textoHeight) / 2;
      let yCurrent = yStart;
      const centerX = rectX + rectWidth / 2;

      lineasDescripcion.forEach((linea) => {
        if (linea.trim() === "") { yCurrent += 6; return; }
        const partes = pdf.splitTextToSize(linea, contentWidth);
        partes.forEach((parte) => {
          if (yCurrent > yBottom - 20) return;
          pdf.text(parte, centerX, yCurrent, { align: "center" });
          yCurrent += 6;
        });
      });

      const espacioCuadroABloqueLegal = 12;
      const yLegal = rectY + rectHeight + espacioCuadroABloqueLegal;

      const textos = [
        `- El costo total del presupuesto es de ${precio}.`,
        "",
        `- El presente presupuesto incluye ${incluye}.`,
        "",
        "- Para la confirmación del trabajo, requerimos una seña del 60% del total del presupuesto.",
        "",
        "Por favor, no dude en ponerse en contacto con nosotros si tiene alguna pregunta o necesita aclaraciones adicionales.",
        "Agradecemos su confianza en nosotros y esperamos poder servirle pronto.",
        "",
        "Atentamente,",
        "Wilson Martínez",
      ];

      pdf.setFontSize(11);
      let yLegalCurrent = yLegal;
      textos.forEach((linea) => {
        const splitLine = pdf.splitTextToSize(linea, contentWidth);
        splitLine.forEach((parte) => {
          if (yLegalCurrent > yBottom - 10) return;
          pdf.text(parte, pageWidth / 2, yLegalCurrent, { align: "center" });
          yLegalCurrent += 6;
        });
        yLegalCurrent += 2;
      });

      const totalPages = pdf.internal.getNumberOfPages();
      pdf.setFontSize(10);
      pdf.setTextColor(80);
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.text(`${i} / ${totalPages}`, 5, 293);
      }

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(pdfUrl);

      if (!previewOnly) {
        pdf.save(`Presupuesto_${numero}_${cliente}.pdf`);
        const next = numero + 1;
        setNumero(next);
        localStorage.setItem("presupuestoN", next);
      }
    };
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Presupuesto</h1>

      {/* Mensaje de error */}
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "15px", fontWeight: "bold" }}>
          {errorMessage}
        </div>
      )}

      {/* Cliente */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Cliente:</label>
        <input
          type="text"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Nombre del cliente"
          style={{ width: "100%", padding: "8px 10px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
      </div>

      {/* Fecha */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Fecha:</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            name="dia"
            placeholder="DD"
            value={fecha.dia}
            onChange={handleFechaChange}
            maxLength={2}
            style={{ flex: "1", padding: "8px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center" }}
          />
          <input
            type="text"
            name="mes"
            placeholder="Mes"
            value={fecha.mes}
            onChange={handleFechaChange}
            style={{ flex: "2", padding: "8px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center" }}
          />
          <input
            type="text"
            name="año"
            placeholder="AAAA"
            value={fecha.año}
            onChange={handleFechaChange}
            maxLength={4}
            style={{ flex: "2", padding: "8px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center" }}
          />
        </div>
      </div>

      {/* Precio */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Precio Total:</label>
        <input
          type="text"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="Ingrese el precio"
          style={{ width: "100%", padding: "8px 10px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
      </div>

      {/* Descripción */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Descripción:</label>
        <textarea
          value={descripcionLibre}
          onChange={(e) => setDescripcionLibre(e.target.value)}
          placeholder="Escriba aquí la descripción detallada..."
          style={{ width: "100%", height: "150px", padding: "8px 10px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc", resize: "vertical" }}
        />
      </div>

      {/* Incluye */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Incluye:</label>
        <textarea
          value={incluye}
          onChange={(e) => setIncluye(e.target.value)}
          placeholder="Incluye..."
          style={{ width: "100%", height: "80px", padding: "8px 10px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc", resize: "vertical" }}
        />
      </div>

      {/* Botones */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          onClick={() => generatePDF(true)}
          style={{ padding: "10px 15px", fontSize: "14px", borderRadius: "5px", border: "none", backgroundColor: "#007BFF", color: "#fff", cursor: "pointer" }}
        >
          Ver Preview
        </button>
        <button
          onClick={() => generatePDF(false)}
          style={{ padding: "10px 15px", fontSize: "14px", borderRadius: "5px", border: "none", backgroundColor: "#28A745", color: "#fff", cursor: "pointer" }}
        >
          Descargar PDF
        </button>
      </div>

      {/* Preview */}
      {pdfPreviewUrl && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc" }}>
          <iframe src={pdfPreviewUrl} width="100%" height="500px" title="PDF Preview" />
        </div>
      )}
    </div>
  );
}
