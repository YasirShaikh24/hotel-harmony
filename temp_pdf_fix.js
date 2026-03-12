  // ─── PDF DOWNLOAD ────────────────────────────────────────────────────────────
  const handleDownloadPdf = (invoice: Invoice) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 45;

    const currency = (num: number) =>
      'Rs.' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const black: [number, number, number] = [17, 24, 39];
    const darkGray: [number, number, number] = [55, 65, 81];
    const lightGray: [number, number, number] = [107, 114, 128];
    const li