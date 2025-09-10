import { utils, write, read } from 'xlsx';

// Função para criar um arquivo Excel de exemplo para importação
export const createExampleExcelFile = () => {
  // Dados de exemplo para o arquivo
  const data = [
    {
      'PN': 'F6V31AB',
      'Familia': 'HP 664',
      'Produto': 'Cartucho HP 664XL Preto',
      'Média de Páginas Impressas': 480,
      'Preço Sugerido': 89.90
    },
    {
      'PN': 'F6V28AB',
      'Familia': 'HP 664',
      'Produto': 'Cartucho HP 664 Colorido',
      'Média de Páginas Impressas': 330,
      'Preço Sugerido': 79.90
    },
    {
      'PN': 'T544120',
      'Familia': 'Epson 544',
      'Produto': 'Cartucho Epson 544 Preto',
      'Média de Páginas Impressas': 400,
      'Preço Sugerido': 59.90
    }
  ];

  // Criar uma nova planilha
  const ws = utils.json_to_sheet(data);

  // Ajustar a largura das colunas
  const wscols = [
    { wch: 15 }, // PN
    { wch: 15 }, // Familia
    { wch: 40 }, // Produto
    { wch: 25 }, // Média de Páginas Impressas
    { wch: 15 }, // Preço Sugerido
  ];

  ws['!cols'] = wscols;

  // Criar um novo livro e adicionar a planilha
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Produtos');

  // Gerar o arquivo
  const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });

  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Função para analisar um arquivo Excel
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

        // Verificar se o cabeçalho está correto
        const header = jsonData[0];
        const expectedHeader = [
          'PN',
          'Familia',
          'Produto',
          'Média de Páginas Impressas',
          'Preço Sugerido'
        ];

        const isHeaderValid = expectedHeader.every((col, index) =>
          col.toLowerCase() === (header[index] || '').toString().toLowerCase()
        );

        if (!isHeaderValid) {
          reject(new Error('O arquivo Excel não tem o formato esperado. Verifique se as colunas estão corretas.'));
          return;
        }

        // Processar os dados
        const products = jsonData.slice(1).map(row => {
          if (!row || row.length < 5) return null;

          return {
            code: row[0]?.toString() || '',
            family: row[1]?.toString() || '',
            name: row[2]?.toString() || '',
            avgPages: parseInt(row[3]) || 0,
            referencePrice: parseFloat(row[4]) || 0,
            currentPrice: parseFloat(row[4]) || 0, // Inicialmente igual ao preço sugerido
            category: 'cartuchos', // Valor padrão
            seller: 'Importado via Excel',
            authorized: true,
            status: 'active',
            lastUpdate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            priceVariation: 0,
            hasAlert: false
          };
        }).filter(Boolean); // Remover valores nulos

        resolve(products);
      } catch (error) {
        reject(new Error(`Erro ao processar o arquivo Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};
