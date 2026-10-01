import { jsPDF } from 'jspdf';
import { personRoute, roles } from './model.js';

export function routesPdf(result, eventName) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 12, columnWidth = 89, bottom = 280;
  let column = 0, y = 25;
  const header = () => {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
    pdf.text('Mesa Certa | Roteiros de networking', margin, 12);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text(pdf.splitTextToSize(String(eventName), 185)[0], margin, 18);
  };
  header();
  const advance = () => {
    if (column === 0) column = 1;
    else { pdf.addPage(); header(); column = 0; }
    y = 25;
  };
  const wrap = (value, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(9);
    return pdf.splitTextToSize(String(value), columnWidth).map(text => ({ text, bold }));
  };
  const print = row => {
    pdf.setFont('helvetica', row.bold ? 'bold' : 'normal'); pdf.setFontSize(9);
    pdf.text(row.text, margin + column * 97, y); y += 4.5;
  };
  for (const person of [...result.input.mobile, ...result.input.fixed]) {
    const rows = [...wrap(`${person.name} | ${person.code}`, true), ...wrap(`${person.company || 'Empresa não informada'} | ${roles[person.role]}`)];
    for (const step of personRoute(result, person)) {
      rows.push(...wrap(`Rodada ${step.rodada} - ${result.input.tables[step.mesa - 1].name}`));
    }
    const size = rows.length * 4.5 + 6;
    if ((size <= bottom - 25 && y + size > bottom) || y + 22 > bottom) advance();
    for (const row of rows) {
      if (y + 4.5 > bottom) {
        advance();
        const continuation = wrap(`Continuação | ${person.code}`, true);
        // Keep the code bounded in the continuation header; full code/name remain in the first block.
        print(continuation[0]);
        print(wrap(person.name, true)[0]);
        y += 2;
      }
      print(row);
    }
    y += 6;
  }
  const count = pdf.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    pdf.setPage(page); pdf.setFontSize(8);
    pdf.text(`Página ${page} de ${count} | ${result.input.engine.R} rodadas | seed ${result.seed}`, margin, 291);
  }
  return pdf;
}

export function routesCsv(result) {
  const cell = value => {
    const text = String(value ?? '');
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
  };
  const lines = [['Nome', 'Código', 'Empresa', 'Papel', 'Rodada', 'Mesa']];
  for (const person of [...result.input.mobile, ...result.input.fixed]) {
    for (const route of personRoute(result, person)) lines.push([person.name, person.code, person.company, roles[person.role], route.rodada, result.input.tables[route.mesa - 1].name]);
  }
  return '\uFEFF' + lines.map(row => row.map(cell).join(';')).join('\r\n');
}
